import { parsePhoneNumber } from 'libphonenumber-js';
import Papa from 'papaparse';

import { CustomerModel } from './model.js';

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

interface CsvRow {
  name?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  company?: string;
  tags?: string;
  notes?: string;
}

const BATCH = 500;

export async function importCustomersCsv(
  csv: string,
  companyId: string,
): Promise<ImportResult> {
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const ops: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> };
      upsert: true;
    };
  }> = [];

  parsed.data.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 header, +1 1-indexed
    const name = row.name?.trim();
    if (!name) {
      result.errors.push({ row: rowNumber, message: 'Missing name' });
      result.skipped++;
      return;
    }
    let phone: string | undefined;
    if (row.phone) {
      try {
        const pn = parsePhoneNumber(row.phone.trim());
        if (!pn.isValid()) throw new Error('invalid');
        phone = pn.number;
      } catch {
        result.errors.push({ row: rowNumber, message: `Invalid phone "${row.phone}"` });
        result.skipped++;
        return;
      }
    }
    const tags = row.tags
      ? row.tags
          .split(/[;,]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const filter = phone ? { companyId, phone } : { companyId, name };
    const set: Record<string, unknown> = { name };
    if (phone) set.phone = phone;
    if (row.email) set.email = row.email.trim().toLowerCase();
    if (row.whatsappNumber) set.whatsappNumber = row.whatsappNumber.trim();
    if (row.company) set.company = row.company.trim();
    if (tags && tags.length) set.tags = tags;
    if (row.notes) set.notes = row.notes;

    ops.push({
      updateOne: {
        filter,
        update: { $set: set, $setOnInsert: { companyId, status: 'active' } },
        upsert: true,
      },
    });
  });

  for (let i = 0; i < ops.length; i += BATCH) {
    const slice = ops.slice(i, i + BATCH);
    const res = await CustomerModel.bulkWrite(slice, { ordered: false });
    result.created += res.upsertedCount ?? 0;
    result.updated += res.modifiedCount ?? 0;
  }

  return result;
}

export async function exportCustomersCsv(
  companyId: string,
): Promise<string> {
  const docs = await CustomerModel.find({ companyId })
    .select('name phone whatsappNumber email company tags status notes')
    .sort({ _id: 1 })
    .lean();
  return Papa.unparse(
    docs.map((d) => ({
      name: d.name,
      phone: d.phone ?? '',
      whatsappNumber: d.whatsappNumber ?? '',
      email: d.email ?? '',
      company: d.company ?? '',
      tags: (d.tags ?? []).join(';'),
      status: d.status,
      notes: d.notes ?? '',
    })),
    { header: true },
  );
}
