/**
 * Per-company concurrency cap (max N simultaneous outbound calls per tenant)
 * and global Twilio origination rate limit (RPS).
 *
 * Implemented as Lua scripts loaded once and EVALSHA'd thereafter, so they
 * are atomic across multiple worker replicas.
 */

import { type Redis } from 'ioredis';

import { env } from './config.js';

const COMPANY_CAP_LUA = `
local key = KEYS[1]
local maxN = tonumber(ARGV[1])
local cur = tonumber(redis.call('GET', key) or '0')
if cur >= maxN then return -1 end
local n = redis.call('INCR', key)
redis.call('EXPIRE', key, 3600)
return n
`;

const COMPANY_RELEASE_LUA = `
local key = KEYS[1]
local cur = tonumber(redis.call('GET', key) or '0')
if cur > 0 then redis.call('DECR', key) end
return 1
`;

/** Token bucket: 1 token / (1/rps) ms, capacity = rps. */
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_sec = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
if tokens == nil then tokens = capacity end
if ts == nil then ts = now_ms end

local elapsed = math.max(0, now_ms - ts) / 1000.0
tokens = math.min(capacity, tokens + elapsed * refill_per_sec)
if tokens < 1 then
  redis.call('HMSET', key, 'tokens', tokens, 'ts', now_ms)
  redis.call('EXPIRE', key, 60)
  return 0
end
tokens = tokens - 1
redis.call('HMSET', key, 'tokens', tokens, 'ts', now_ms)
redis.call('EXPIRE', key, 60)
return 1
`;

export class ConcurrencyGate {
  private capSha?: string;
  private releaseSha?: string;
  private rateSha?: string;

  constructor(private readonly r: Redis) {}

  private async loadScripts(): Promise<void> {
    if (this.capSha && this.releaseSha && this.rateSha) return;
    this.capSha = (await this.r.script('LOAD', COMPANY_CAP_LUA)) as string;
    this.releaseSha = (await this.r.script('LOAD', COMPANY_RELEASE_LUA)) as string;
    this.rateSha = (await this.r.script('LOAD', RATE_LIMIT_LUA)) as string;
  }

  /**
   * Attempt to acquire one origination slot for a company.
   * Returns a release function on success, or null if denied.
   */
  async acquireOriginationSlot(companyId: string): Promise<(() => Promise<void>) | null> {
    await this.loadScripts();
    const key = `vf:concurrency:${companyId}`;
    const maxN = env().PER_COMPANY_MAX_CONCURRENT;
    const result = (await this.r.evalsha(this.capSha!, 1, key, String(maxN))) as number;
    if (result < 0) return null;
    return async () => {
      await this.r.evalsha(this.releaseSha!, 1, key);
    };
  }

  /** True if we are allowed to make another Twilio origination right now (global RPS bucket). */
  async tryConsumeOriginationToken(): Promise<boolean> {
    await this.loadScripts();
    const key = 'vf:twilio:origination:rps';
    const rps = env().TWILIO_ORIGINATION_RPS;
    const capacity = Math.max(1, Math.ceil(rps));
    const result = (await this.r.evalsha(
      this.rateSha!,
      1,
      key,
      String(capacity),
      String(rps),
      String(Date.now()),
    )) as number;
    return result === 1;
  }
}
