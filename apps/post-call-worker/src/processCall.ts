import { extract, loadProvider, summarize, type ExtractionField } from './ai.js';
import { score, type ScoringRule } from './leadScore.js';
import { log } from './logger.js';
import { Call, CampaignRun } from './models.js';

/**
 * Process a finished call: summarize, extract structured data, compute lead
 * score, persist all of it. Called by the post-call BullMQ consumer.
 */
export async function processCall(callId: string): Promise<void> {
  const call = await Call.findById(callId).lean();
  if (!call) {
    log().warn({ callId }, 'processCall: call not found');
    return;
  }
  if (!call.transcript?.length) {
    log().info({ callId }, 'processCall: empty transcript, skipping');
    return;
  }

  const run = await CampaignRun.findById(call.campaignRunId).lean();
  if (!run) {
    log().warn({ callId }, 'processCall: campaign run not found');
    return;
  }

  const transcriptText = call.transcript
    .map((t) => `${t.role.toUpperCase()}: ${t.text}`)
    .join('\n');

  const aiProviderId = run.campaignSnapshot.aiProviderId;
  if (!aiProviderId) {
    log().warn({ callId }, 'processCall: no aiProviderId on snapshot');
    return;
  }
  const provider = await loadProvider(String(aiProviderId));
  const fields = (run.campaignSnapshot.agent?.extractionFields ?? []) as ExtractionField[];
  const rules = (run.campaignSnapshot.agent?.leadScoringRules ?? []) as ScoringRule[];

  const [sumResult, extracted] = await Promise.all([
    summarize(provider, transcriptText).catch((err) => {
      log().warn({ err, callId }, 'summarize failed');
      return { summary: '', sentiment: 'neutral' as const };
    }),
    extract(provider, transcriptText, fields).catch((err) => {
      log().warn({ err, callId }, 'extract failed');
      return {};
    }),
  ]);

  const lead = score(extracted, rules);

  await Call.updateOne(
    { _id: callId },
    {
      $set: {
        summary: sumResult.summary,
        sentiment: sumResult.sentiment,
        extractedData: extracted,
        leadScore: lead.score,
        leadQualification: lead.qualification,
      },
    },
  );

  log().info(
    { callId, leadScore: lead.score, leadQualification: lead.qualification },
    'post-call processing complete',
  );
}
