import { Types } from 'mongoose';

import { CallModel } from '../calls/model.js';
import { CampaignRunModel } from './campaign-run.model.js';
import { enqueueCall, newCallJobId } from '../../lib/queues.js';

import type { DispatchPlan, DispatchResult, Dispatcher } from './dispatcher.js';

/**
 * Real campaign dispatcher: for each customer in the launch plan, create a
 * Call record (status 'initiated') and enqueue a `call` job on BullMQ.
 *
 * Wired into the api process via setDispatcher(bullDispatcher) in server.ts.
 */
export const bullDispatcher: Dispatcher = async (
  plan: DispatchPlan,
  ctx: { campaignRunId: string },
): Promise<DispatchResult> => {
  const run = await CampaignRunModel.findById(ctx.campaignRunId).lean();
  if (!run) throw new Error(`CampaignRun not found: ${ctx.campaignRunId}`);

  const snapshot = run.campaignSnapshot as {
    _id: Types.ObjectId;
    companyId: Types.ObjectId;
    primaryChannel: Types.ObjectId;
  };

  let enqueued = 0;
  for (const customerId of plan.customerIds) {
    const callJobId = newCallJobId();
    await CallModel.create({
      companyId: snapshot.companyId,
      campaignId: snapshot._id,
      campaignRunId: new Types.ObjectId(ctx.campaignRunId),
      customerId: new Types.ObjectId(customerId),
      contactChannelId: snapshot.primaryChannel,
      callJobId,
      status: 'initiated',
    });
    await enqueueCall({
      callJobId,
      companyId: String(snapshot.companyId),
      campaignId: String(snapshot._id),
      campaignRunId: ctx.campaignRunId,
      customerId,
      contactChannelId: String(snapshot.primaryChannel),
      retryCount: 0,
    });
    enqueued++;
  }
  return { enqueuedCount: enqueued };
};
