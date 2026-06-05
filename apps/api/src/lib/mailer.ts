import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../config/env.js';

let cached: Transporter | undefined;

export function mailer(): Transporter {
  if (cached) return cached;
  const e = env();
  cached = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
    secure: e.SMTP_PORT === 465,
  });
  return cached;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  await mailer().sendMail({
    from: env().SMTP_FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
}

/** Swap the transporter (test-only). */
export function __setMailerForTesting(t: Transporter | undefined): void {
  cached = t;
}
