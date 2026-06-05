/**
 * Campaign launch dispatcher.
 *
 * Phase 1K stub: counts customers to enqueue and returns the planned count.
 * Phase 1L will replace this with a BullMQ producer that pushes one `call`
 * job per customer onto the call queue (respecting schedule + retry rules).
 */

import { logger } from '../../lib/logger.js';

export interface DispatchPlan {
  customerIds: string[];
}

export interface DispatchResult {
  enqueuedCount: number;
}

export type Dispatcher = (plan: DispatchPlan, ctx: { campaignRunId: string }) => Promise<DispatchResult>;

let activeDispatcher: Dispatcher = async (plan, ctx) => {
  logger().info(
    { campaignRunId: ctx.campaignRunId, customers: plan.customerIds.length },
    'campaign launch: dispatcher stub — Phase 1L will enqueue these jobs onto BullMQ',
  );
  return { enqueuedCount: plan.customerIds.length };
};

/** Phase 1L will call this from apps/api/src/server.ts to inject the real BullMQ producer. */
export function setDispatcher(d: Dispatcher): void {
  activeDispatcher = d;
}

export function getDispatcher(): Dispatcher {
  return activeDispatcher;
}
