# VoiceFlow AI — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a **roadmap-style master plan**: Phase 1 has bite-sized TDD tasks; Phases 2–8 are scoped as milestone lists with acceptance criteria, to be expanded into their own per-phase plans before execution.

**Goal:** Build VoiceFlow AI — a production-grade, multi-tenant SaaS that automates customer conversations via outbound phone calls (Phase 1), WhatsApp voice/chat (Phases 2–3), and hybrid routing (Phase 4), with RAG, analytics, billing, and a marketing site bolted on in Phases 5–8.

**Architecture:** Three Node processes (`apps/api`, `apps/call-worker`, `apps/post-call-worker`) over a shared MongoDB Atlas + Redis stack, coupled only via BullMQ + Socket.IO. The call worker owns the live Twilio Media Streams WebSocket and runs an in-process per-call audio loop (Silero VAD → OpenAI STT → LLM stream → ElevenLabs TTS stream, with barge-in), keeping latency off the database hot path. Frontend is a Vite/React/Tailwind/Shadcn SPA in `apps/web`. Multi-tenancy is enforced at the middleware layer via a `companyId` derived from the JWT and stamped onto every Mongoose query through repository helpers.

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI, Framer Motion, TanStack Query v5, React Hook Form + Zod, Recharts, Zustand, Socket.IO client
- **Backend:** Node 20, Express 4, TypeScript, Mongoose 8, Redis 7, BullMQ 5, Socket.IO 4, Zod, Pino logger, Helmet, express-rate-limit
- **Voice / AI:** ElevenLabs (`eleven_flash_v2_5`, `ulaw_8000`), OpenAI (`gpt-4o-transcribe` for STT, `gpt-4o-mini` for LLM), Twilio Programmable Voice + Media Streams + SMS
- **Infra:** Docker Compose (mongo/redis/mailhog for dev), Nginx (prod), pnpm workspaces, Vitest, Supertest, Playwright (later phases)

---

## Context

The user (working from `/home/nurulkomor/Documents/personal/ai-calling`) has a single `.env` file describing the intended system — no source code exists. The `.env` already commits to a specific, opinionated production architecture: real-time bidirectional Twilio Media Streams with μ-law 8 kHz audio end-to-end (matching ElevenLabs output and avoiding any resampling cost), a separate call-worker process with per-company concurrency caps and Twilio origination rate limiting, and credential encryption at rest via a master key. The spec is broad (a Vapi/Retell-class SaaS), but the user has chosen to phase delivery starting with outbound phone calls and add WhatsApp/RAG/billing/landing in subsequent phases. This plan exists so that work can be picked up by any engineer or subagent without re-deriving these decisions.

**Security note up front:** The committed `MONGO_URI` in `.env` contains a weak password (`root:asdf`) and is documented as such in-file. Phase 1 Task 0 rotates this before any code runs against Atlas.

---

## Monorepo File Structure

```
ai-calling/
├── apps/
│   ├── api/                              # Express HTTP API (port 4000)
│   │   ├── src/
│   │   │   ├── config/                   # env loader (zod-validated), constants
│   │   │   ├── lib/                      # mongo, redis, queues, socket, crypto, logger
│   │   │   ├── middleware/               # auth, tenant scope, rate-limit, error, requestId
│   │   │   ├── modules/                  # one folder per feature module
│   │   │   │   ├── auth/                 # signup, login, refresh, password reset
│   │   │   │   ├── companies/            # tenants
│   │   │   │   ├── users/                # users + role assignment
│   │   │   │   ├── roles/                # role + permission CRUD
│   │   │   │   ├── customers/            # CRUD + CSV import/export
│   │   │   │   ├── customer-lists/       # segments
│   │   │   │   ├── contact-channels/     # phone/whatsapp numbers
│   │   │   │   ├── voice-profiles/       # ElevenLabs voice catalog per tenant
│   │   │   │   ├── ai-providers/         # per-tenant LLM credentials (encrypted)
│   │   │   │   ├── campaigns/            # CRUD + schedule + launch
│   │   │   │   ├── calls/                # call records, transcripts, recordings
│   │   │   │   ├── analytics/            # rollups
│   │   │   │   ├── webhooks/             # twilio inbound webhooks (status, AMD, recording)
│   │   │   │   └── notifications/        # email + in-app + outbound webhooks
│   │   │   ├── routes/                   # router composition + /twiml endpoint
│   │   │   ├── app.ts                    # express app factory (test-friendly)
│   │   │   └── server.ts                 # bootstrap
│   │   ├── tests/                        # vitest + supertest
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── call-worker/                      # BullMQ + WebSocket (port 4100)
│   │   ├── src/
│   │   │   ├── ws/mediaStreamServer.ts   # raw ws upgrade handler
│   │   │   ├── session/CallSession.ts    # per-call state machine
│   │   │   ├── audio/                    # vad.ts, mulaw.ts, ringBuffer.ts
│   │   │   ├── providers/                # AIProvider iface + impls (OpenAI/Claude/Gemini)
│   │   │   ├── tts/elevenLabsClient.ts   # streaming WS client
│   │   │   ├── stt/openAiSttClient.ts    # HTTP client
│   │   │   ├── jobs/                     # BullMQ consumers (call, post-call, recording)
│   │   │   ├── recording/                # raw μ-law capture + ffmpeg mux job
│   │   │   ├── concurrency/              # Redis Lua: per-company cap + origination RPS
│   │   │   └── index.ts                  # bootstrap (preload VAD, start ws + queues)
│   │   └── tests/
│   ├── post-call-worker/                 # BullMQ-only, no network ingress
│   │   ├── src/
│   │   │   ├── jobs/summarize.ts         # call summary via LLM
│   │   │   ├── jobs/extract.ts           # structured data extraction
│   │   │   ├── jobs/leadScore.ts         # configurable scoring
│   │   │   └── index.ts
│   │   └── tests/
│   └── web/                              # React/Vite SPA (port 5173)
│       ├── src/
│       │   ├── app/                      # router, providers, root layout
│       │   ├── components/               # shared (shadcn + custom)
│       │   ├── features/                 # mirror of backend modules
│       │   ├── lib/api.ts, lib/socket.ts # clients
│       │   ├── pages/                    # public (landing, login)
│       │   └── styles/
│       ├── index.html
│       └── vite.config.ts
├── packages/
│   ├── shared-types/                     # DTO interfaces + Zod schemas shared API↔Web
│   ├── shared-config/                    # eslint, prettier, tsconfig presets
│   └── shared-utils/                     # pure helpers (date, currency, error codes)
├── services/
│   └── docker/                           # init scripts, nginx conf
├── docker-compose.yml                    # mongo, redis, mailhog
├── package.json                          # root scripts only
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env                                  # gitignored
├── .env.example                          # committed, no secrets
└── README.md
```

Files that change together live together (each module folder contains its `model.ts`, `repository.ts`, `service.ts`, `controller.ts`, `dto.ts`, `routes.ts`, `*.test.ts`). Split is by responsibility (module), not by technical layer (no top-level `controllers/` or `models/` dirs).

---

# PHASE 1 — Foundation + Outbound Phone MVP (DETAILED TDD)

**Phase 1 ships:** a deployable system where a Company Admin can sign up, add a Twilio number, import customers via CSV, create an outbound campaign with a system prompt and ElevenLabs voice, launch it, watch calls in real time, and review per-call transcripts + summaries + extracted data + lead scores.

**Phase 1 explicitly excludes:** WhatsApp (Phase 2/3), hybrid routing (Phase 4), RAG (Phase 5), heavy analytics (Phase 6), billing (Phase 7), public marketing site (Phase 8).

## Sub-phase 1A — Monorepo Bootstrap

### Task 0: Rotate the leaked Mongo credentials

**Files:**
- Modify: `.env` (user-side; instruct only — never commit)

- [ ] **Step 1:** Log into MongoDB Atlas, rotate the `root` user password (or create a new least-privileged user `voiceflow-app` scoped to db `ai-call`), update `.env` `MONGO_URI`.
- [ ] **Step 2:** Tighten Atlas IP allowlist to the developer's current IP + planned deploy targets only. Remove `0.0.0.0/0` if present.
- [ ] **Step 3:** Confirm `.env` is in `.gitignore` (next task creates `.gitignore`).

### Task 1: Initialize pnpm workspace + base tooling

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.nvmrc`, `.env.example`, `README.md`

- [ ] **Step 1:** `git init && git branch -M main`. Create `.gitignore` covering `node_modules`, `dist`, `.env`, `.env.local`, `coverage`, `.DS_Store`, `data/`.
- [ ] **Step 2:** Create `.nvmrc` with `20.11.1` (LTS at time of writing). Create root `package.json`:

```json
{
  "name": "voiceflow-ai",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "@types/node": "20.12.7"
  }
}
```

- [ ] **Step 3:** Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4:** Create `tsconfig.base.json` with `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `esModuleInterop: true`, `skipLibCheck: true`, `forceConsistentCasingInFileNames: true`, `noUncheckedIndexedAccess: true`.
- [ ] **Step 5:** Copy current `.env` to `.env.example` and blank every secret value (preserve keys + comments).
- [ ] **Step 6:** `git add . && git commit -m "chore: init monorepo scaffold"`.

### Task 2: Shared tooling packages

**Files:**
- Create: `packages/shared-config/{eslint.cjs,prettier.cjs,tsconfig.lib.json,package.json}`
- Create: `packages/shared-types/{src/index.ts,package.json,tsconfig.json}`
- Create: `packages/shared-utils/{src/index.ts,package.json,tsconfig.json}`

- [ ] **Step 1:** Add eslint flat config in `shared-config` using `@typescript-eslint`, `eslint-plugin-import`, and prettier integration.
- [ ] **Step 2:** Create stub exports in `shared-types/src/index.ts` (`export {};`) and `shared-utils/src/index.ts` (`export {};`).
- [ ] **Step 3:** Each package `package.json` declares `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, and depends on `voiceflow-shared-config` via `workspace:*`.
- [ ] **Step 4:** `pnpm install` at root resolves cleanly.
- [ ] **Step 5:** Commit: `chore: shared-config/types/utils stubs`.

### Task 3: docker-compose for local infra

**Files:**
- Create: `docker-compose.yml`, `services/docker/mongo-init.js`

- [ ] **Step 1:** docker-compose defines `mongo` (`mongo:7`, port 27017, with init script creating `ai-call` db and an app user), `redis` (`redis:7-alpine`, port 6379), `mailhog` (port 8025 UI + 1025 SMTP).
- [ ] **Step 2:** `docker compose up -d && docker compose ps` — verify all three healthy.
- [ ] **Step 3:** Update `.env` `MONGO_URI` to switch between Atlas (default) and local (`mongodb://app:app@localhost:27017/ai-call?authSource=admin`) — keep both, comment toggling.
- [ ] **Step 4:** Commit: `chore: docker-compose for local mongo/redis/mailhog`.

## Sub-phase 1B — API Foundations

### Task 4: Bootstrap `apps/api`

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/server.ts`, `apps/api/src/app.ts`, `apps/api/vitest.config.ts`, `apps/api/tests/health.test.ts`

- [ ] **Step 1: Write the failing test** — `tests/health.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run** — `pnpm --filter api test` — expected FAIL: cannot find `../src/app`.
- [ ] **Step 3: Implement** — `src/app.ts`:

```ts
import express, { type Express } from 'express';

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}
```

- [ ] **Step 4: Implement** — `src/server.ts`:

```ts
import { createApp } from './app';
const port = Number(process.env.BACKEND_PORT ?? 4000);
createApp().listen(port, () => console.log(`api listening on ${port}`));
```

- [ ] **Step 5:** Re-run test — PASS.
- [ ] **Step 6:** Commit: `feat(api): bootstrap express app with health endpoint`.

### Task 5: Zod-validated env loader

**Files:**
- Create: `apps/api/src/config/env.ts`, `apps/api/tests/config/env.test.ts`

- [ ] **Step 1: Failing test** — assert that `loadEnv({...validInput})` returns a typed object and `loadEnv({})` throws with a useful message naming the missing key.
- [ ] **Step 2:** Implement using `zod` — schema covers every key in `.env.example` with sensible defaults and required-on-prod gates (`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_MASTER_KEY` all required). Export `Env` type via `z.infer`.
- [ ] **Step 3:** Replace `process.env.BACKEND_PORT` reads in `server.ts` with the loader result.
- [ ] **Step 4:** Tests PASS. Commit: `feat(api): zod-validated env loader`.

### Task 6: Pino logger + request-id middleware

**Files:**
- Create: `apps/api/src/lib/logger.ts`, `apps/api/src/middleware/requestId.ts`, `apps/api/tests/middleware/requestId.test.ts`

- [ ] **Step 1: Failing test** — request without `x-request-id` header gets one assigned and echoed back; request with one keeps it.
- [ ] **Step 2:** Implement middleware (uses `crypto.randomUUID()`), wire into `createApp()` before any other middleware. Pino child logger per request stored on `req.log`.
- [ ] **Step 3:** Commit: `feat(api): structured logging + request id`.

### Task 7: Mongo connection helper + Redis client

**Files:**
- Create: `apps/api/src/lib/mongo.ts`, `apps/api/src/lib/redis.ts`, `apps/api/tests/lib/mongo.test.ts`

- [ ] **Step 1: Failing test** — use `mongodb-memory-server` to spin an ephemeral mongo; assert `connectMongo()` resolves and `mongoose.connection.readyState === 1`.
- [ ] **Step 2:** Implement `connectMongo(uri)` and `disconnectMongo()`. Use mongoose with `autoIndex: false` in production.
- [ ] **Step 3:** Implement `getRedis()` returning a singleton `ioredis` instance, with lazy connect and an `errorHandler` that logs but does not throw.
- [ ] **Step 4:** Commit: `feat(api): mongo + redis connection helpers`.

### Task 8: Central error handler + AppError class

**Files:**
- Create: `apps/api/src/lib/errors.ts`, `apps/api/src/middleware/errorHandler.ts`, `apps/api/tests/middleware/errorHandler.test.ts`

- [ ] **Step 1: Failing test** — endpoint throws `new AppError('not_found', 'X not found', 404)`; response is `{ error: { code, message } }` with status 404. Unknown errors → 500 with code `internal_error`, no stack leak in production.
- [ ] **Step 2:** Implement `AppError` and error middleware (must be `(err, req, res, next)` 4-arg signature, registered last).
- [ ] **Step 3:** Commit: `feat(api): typed errors and central handler`.

### Task 9: Helmet, CORS, rate limit, body parser

**Files:**
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/tests/security.test.ts`

- [ ] **Step 1: Failing test** — preflight `OPTIONS` from disallowed origin → 403/blocked; from `CORS_ORIGINS` → 204 with correct headers. Helmet sets `X-Content-Type-Options: nosniff`.
- [ ] **Step 2:** Add `helmet()`, `cors({origin: env.CORS_ORIGINS.split(',')})`, `express-rate-limit` keyed by IP for 300 req / 60s, JSON body limit 1MB, URL-encoded false (we don't accept forms server-side except for Twilio webhooks).
- [ ] **Step 3:** Commit: `feat(api): security middleware`.

## Sub-phase 1C — Crypto + Encryption

### Task 10: AES-256-GCM credential encryption

**Files:**
- Create: `packages/shared-utils/src/crypto.ts`, `packages/shared-utils/tests/crypto.test.ts`

- [ ] **Step 1: Failing test** — `encrypt(plaintext, masterKey, version)` returns `{ciphertext, iv, tag, version}`; `decrypt(...)` round-trips identically; mutated ciphertext → throws `auth_tag_mismatch`.
- [ ] **Step 2:** Implement using `node:crypto` `createCipheriv('aes-256-gcm', ...)` with 96-bit random IV, 128-bit tag. Master key from `ENCRYPTION_MASTER_KEY` (base64-decoded to 32 bytes).
- [ ] **Step 3:** Add `EncryptedField` Zod schema and a Mongoose subdocument schema usable directly on models. Commit: `feat(utils): AES-256-GCM at-rest encryption`.

## Sub-phase 1D — Multi-tenant Auth

### Task 11: `Company` model + repository

**Files:**
- Create: `apps/api/src/modules/companies/{model.ts,repository.ts,dto.ts,*.test.ts}`

Mongoose model:

```ts
const CompanySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  status: { type: String, enum: ['active','suspended'], default: 'active' },
  settings: {
    defaultAiProviderId: { type: ObjectId, ref: 'AiProvider' },
    defaultVoiceProfileId: { type: ObjectId, ref: 'VoiceProfile' },
    defaultContactChannelId: { type: ObjectId, ref: 'ContactChannel' },
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
```

- [ ] **Step 1: Failing test** — `repo.create({name, slug})` persists; `repo.findBySlug(slug)` returns it; duplicate slug → throws.
- [ ] **Step 2:** Implement model + repository (thin wrapper exposing only methods we use; no leaking of mongoose queries to services).
- [ ] **Step 3:** Commit: `feat(companies): model + repository`.

### Task 12: `Role` and `Permission` models

Seed roles: `super_admin`, `company_admin`, `campaign_manager`, `agent`, `viewer`.

Permission tokens are strings of form `<resource>:<action>` (e.g. `campaigns:create`, `calls:listen`).

- [ ] **Step 1: Failing test** — seeding script creates 5 roles with correct default permission sets; idempotent (running twice yields same state).
- [ ] **Step 2:** Implement `RoleSchema` (companyId nullable for built-in super_admin), `PermissionSchema` (resource, action, label), and `seedDefaultRoles(companyId)` for new tenant onboarding.
- [ ] **Step 3:** Commit: `feat(rbac): roles, permissions, seed`.

### Task 13: `User` model + signup

**Files:**
- Create: `apps/api/src/modules/users/{model.ts,repository.ts,*.test.ts}`
- Create: `apps/api/src/modules/auth/{controller.ts,service.ts,routes.ts,dto.ts,*.test.ts}`

User schema fields: `email` (unique compound with `companyId`), `passwordHash`, `companyId`, `roleId`, `firstName`, `lastName`, `status`, `lastLoginAt`.

- [ ] **Step 1: Failing test** — `POST /api/v1/auth/signup` with `{companyName, email, password, firstName, lastName}` returns 201, creates Company + seeded roles + first user as `company_admin`, returns `{accessToken, refreshToken, user}`.
- [ ] **Step 2:** Service uses a Mongo transaction to create company + roles + user atomically. Password hashed via `bcrypt` with `BCRYPT_ROUNDS=12`. JWTs minted with company + role claims.
- [ ] **Step 3:** Tests for: duplicate email rejected, password complexity (min 12 chars, 1 number) enforced, slug auto-generated from company name with collision suffix.
- [ ] **Step 4:** Commit: `feat(auth): signup creates tenant + admin user`.

### Task 14: Login, refresh, logout

- [ ] **Step 1: Failing test** — login with correct creds returns access+refresh; wrong password → 401; access token expires in 15m (decode and check `exp`); refresh endpoint exchanges valid refresh for new access.
- [ ] **Step 2:** Refresh tokens stored as hashed JWTs in `RefreshToken` collection keyed by user + jti; logout revokes by jti.
- [ ] **Step 3:** Tests for: refresh after logout fails, refresh after rotation fails (single-use refresh tokens).
- [ ] **Step 4:** Commit: `feat(auth): login + refresh rotation + logout`.

### Task 15: Password reset flow

- [ ] **Step 1: Failing tests** — `POST /auth/forgot-password` accepts any email and always returns 200 (no user enumeration); if user exists, a `PasswordResetToken` is created with 1h TTL; reset endpoint validates token + sets new password.
- [ ] **Step 2:** Send email via nodemailer to Mailhog in dev. Token is a random 32-byte hex stored hashed.
- [ ] **Step 3:** Commit: `feat(auth): password reset via email`.

## Sub-phase 1E — RBAC + Tenant Scope Middleware

### Task 16: `authenticate` middleware

**Files:**
- Create: `apps/api/src/middleware/authenticate.ts`, tests

- [ ] **Step 1: Failing test** — request without `Authorization` → 401; with valid bearer → `req.user = {id, companyId, roleId, permissions: Set<string>}`; expired token → 401 code `token_expired`.
- [ ] **Step 2:** Implement; load role's permissions on first request and cache in Redis 5m by roleId.
- [ ] **Step 3:** Commit: `feat(api): JWT authenticate middleware`.

### Task 17: `requirePermission` middleware

- [ ] **Step 1: Failing test** — request with role missing `campaigns:create` → 403; with permission → next().
- [ ] **Step 2:** Implement `requirePermission(...tokens: string[])` factory.
- [ ] **Step 3:** Commit: `feat(api): permission guard`.

### Task 18: `tenantScope` repository helper

**Files:**
- Create: `packages/shared-utils/src/tenantScope.ts`, tests

- [ ] **Step 1: Failing test** — `scoped(model, companyId).find({})` always includes `companyId` filter; attempts to `find({companyId: otherCompanyId})` raise `cross_tenant_violation`.
- [ ] **Step 2:** Implement a `scoped()` helper that wraps a mongoose Model and enforces companyId on every read/write call. Repositories use this helper rather than touching the raw model.
- [ ] **Step 3:** Commit: `feat(utils): tenant scoping helper`.

## Sub-phase 1F — Customers

### Task 19: Customer model + CRUD

**Files:**
- Create: `apps/api/src/modules/customers/{model.ts,repository.ts,service.ts,controller.ts,routes.ts,dto.ts,*.test.ts}`

```ts
const CustomerSchema = new Schema({
  companyId: { type: ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, index: true },           // E.164
  whatsappNumber: { type: String },
  email: { type: String, index: true },
  company: String,
  tags: { type: [String], index: true },
  customFields: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['active','do_not_contact'], default: 'active' },
  notes: String,
}, { timestamps: true });
CustomerSchema.index({ companyId: 1, phone: 1 }, { unique: true, sparse: true });
```

- [ ] **Step 1: Failing tests** — full CRUD via REST: create, get, list (paginated, filterable by tag/status, searchable by name/phone/email), update, delete; cross-tenant isolation (User A cannot see Company B's customers).
- [ ] **Step 2:** Implement; phone validated as E.164 via `libphonenumber-js`.
- [ ] **Step 3:** Commit: `feat(customers): CRUD with tenant isolation`.

### Task 20: CSV import + export

**Files:**
- Create: `apps/api/src/modules/customers/import.ts`, `export.ts`, tests

- [ ] **Step 1: Failing test** — `POST /customers/import` with a multipart CSV (`name,phone,email,tags`) creates rows in batches of 500, dedupes by `(companyId, phone)`, returns `{created, updated, skipped, errors: [{row, message}]}`.
- [ ] **Step 2:** Use `papaparse` for parsing, BullMQ job for large imports (>5000 rows). Streaming `GET /customers/export.csv` for export.
- [ ] **Step 3:** Commit: `feat(customers): CSV import/export`.

## Sub-phase 1G — Customer Lists

### Task 21: Static + dynamic customer lists

**Files:**
- Create: `apps/api/src/modules/customer-lists/{model.ts,...}`

```ts
const CustomerListSchema = new Schema({
  companyId, name, type: { enum: ['static','dynamic'] },
  staticIds: [ObjectId],          // for type=static
  filter: Schema.Types.Mixed,     // for type=dynamic — same shape as customer list filters
}, { timestamps: true });
```

- [ ] **Step 1: Failing tests** — create static list of 50 customers; resolves to 50 via `service.resolve(listId)`; dynamic list with `{tags: ['vip']}` resolves to all matching customers at query time.
- [ ] **Step 2:** Implement + endpoints. Commit: `feat(customer-lists): static + dynamic segments`.

## Sub-phase 1H — Contact Channels (Twilio Numbers)

### Task 22: Contact channel CRUD

**Files:**
- Create: `apps/api/src/modules/contact-channels/{model.ts,...}`

```ts
const ContactChannelSchema = new Schema({
  companyId,
  type: { enum: ['phone','whatsapp'], required: true },
  provider: { enum: ['twilio','meta','vonage','plivo'], required: true },
  number: { type: String, required: true },      // E.164
  friendlyName: String,
  twilioSid: String,
  isDefault: { type: Boolean, default: false },
  status: { enum: ['active','disabled'], default: 'active' },
}, { timestamps: true });
ContactChannelSchema.index({ companyId: 1, number: 1 }, { unique: true });
```

- [ ] **Step 1: Failing tests** — CRUD; setting `isDefault: true` clears it from siblings of the same type; cannot delete a channel referenced by an active campaign (FK check).
- [ ] **Step 2:** Commit: `feat(contact-channels): CRUD`.

### Task 23: Twilio number provisioning helper (deferred — manual UI for MVP)

For Phase 1 we accept numbers entered manually with their SID. A later task adds the buy/search-number flow. Skip automated provisioning; document as a Phase-2 enhancement.

## Sub-phase 1I — Voice Profiles (ElevenLabs)

### Task 24: Voice profile model + ElevenLabs catalog sync

**Files:**
- Create: `apps/api/src/modules/voice-profiles/{model.ts,elevenLabsClient.ts,...}`

```ts
const VoiceProfileSchema = new Schema({
  companyId,
  name: { type: String, required: true },
  provider: { enum: ['elevenlabs'], default: 'elevenlabs' },
  voiceId: { type: String, required: true },     // ElevenLabs voice_id
  language: { type: String, default: 'en' },
  gender: { enum: ['male','female','neutral'] },
  description: String,
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });
```

- [ ] **Step 1: Failing tests** — CRUD; `GET /voice-profiles/catalog` proxies to ElevenLabs `/v1/voices` and returns the list (cached 10m in Redis); no API key leaks in responses.
- [ ] **Step 2:** Implement `elevenLabsClient.listVoices()`; controller endpoint uses tenant's stored ElevenLabs key (Phase 1.5) or falls back to `process.env.ELEVENLABS_API_KEY` for now.
- [ ] **Step 3:** Commit: `feat(voice-profiles): CRUD + ElevenLabs catalog proxy`.

## Sub-phase 1J — AI Provider Abstraction

### Task 25: `AIProvider` interface + OpenAI implementation

**Files:**
- Create: `apps/call-worker/src/providers/{AIProvider.ts,OpenAIProvider.ts,index.ts,*.test.ts}`

```ts
export interface AIProvider {
  readonly name: 'openai' | 'claude' | 'gemini' | 'openrouter';
  completeStream(params: {
    systemPrompt: string;
    history: ChatMessage[];
    userInput: string;
    maxTokens?: number;
  }): AsyncIterable<string>;                       // token-by-token
  summarize(transcript: string): Promise<string>;
  extract<T>(transcript: string, schema: JsonSchema): Promise<T>;
}
```

- [ ] **Step 1: Failing tests** — given a mocked OpenAI client, `completeStream({...})` yields tokens in order; `summarize()` returns a string; `extract()` validates against schema and throws on mismatch.
- [ ] **Step 2:** Implement OpenAI provider using the official SDK with `stream: true`. Use Zod-from-JSON-schema for `extract()` validation.
- [ ] **Step 3:** Commit: `feat(providers): AIProvider interface + OpenAI impl`.

### Task 26: AI provider model (per-tenant credential storage)

**Files:**
- Create: `apps/api/src/modules/ai-providers/{model.ts,service.ts,...}`

```ts
const AiProviderSchema = new Schema({
  companyId,
  provider: { enum: ['openai','claude','gemini','openrouter'], required: true },
  apiKey: EncryptedFieldSchema,                  // AES-256-GCM
  model: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });
AiProviderSchema.index({ companyId: 1, provider: 1, isDefault: 1 });
```

- [ ] **Step 1: Failing tests** — create stores encrypted key; read returns decrypted key only via `service.getDecryptedKey(id)` (not via REST GET); setting `isDefault` clears siblings.
- [ ] **Step 2:** Implement `ProviderFactory.forCompany(companyId)` that returns a configured `AIProvider` instance. Used by the call worker.
- [ ] **Step 3:** Commit: `feat(ai-providers): per-tenant credential storage`.

## Sub-phase 1K — Campaigns

### Task 27: Campaign model + CRUD

**Files:**
- Create: `apps/api/src/modules/campaigns/{model.ts,...}`

```ts
const CampaignSchema = new Schema({
  companyId,
  name: { type: String, required: true },
  description: String,
  type: { enum: ['phone_call','whatsapp_call','whatsapp_chat','hybrid'], required: true },
  status: { enum: ['draft','scheduled','running','paused','completed','failed'], default: 'draft' },
  // Phase 1 ignores hybrid routing; type='phone_call' only for MVP
  primaryChannel: { type: String },              // contactChannelId
  fallbackChannels: [String],                    // ordered; populated in Phase 4
  customerListId: { type: ObjectId, ref: 'CustomerList', required: true },
  aiProviderId: { type: ObjectId, ref: 'AiProvider', required: true },
  voiceProfileId: { type: ObjectId, ref: 'VoiceProfile', required: true },
  agent: {
    name: String,
    personality: String,
    systemPrompt: { type: String, required: true },
    language: { type: String, default: 'en' },
    requiredQuestions: [String],
    extractionSchema: Schema.Types.Mixed,        // JSON Schema for structured extraction
    leadScoringRules: [{ when: String, points: Number }],
    successCriteria: String,
  },
  schedule: {
    startAt: Date,
    workingHours: { start: String, end: String, timezone: String },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
  },
  retryRules: {
    maxRetries: { type: Number, default: 3 },
    retryAfterHours: { type: Number, default: 24 },
  },
  stats: {
    totalCustomers: { type: Number, default: 0 },
    completedCalls: { type: Number, default: 0 },
    failedCalls: { type: Number, default: 0 },
    qualifiedLeads: { type: Number, default: 0 },
  },
}, { timestamps: true });
```

- [ ] **Step 1: Failing tests** — CRUD; `POST /campaigns/:id/launch` transitions draft→scheduled and enqueues jobs; `POST /campaigns/:id/pause` halts further job enqueueing (in-flight calls finish); `POST /campaigns/:id/resume` resumes.
- [ ] **Step 2:** Implement. Launching resolves the customer list, enqueues one `call` job per customer with `delay` computed from schedule, all sharing `campaignRunId`.
- [ ] **Step 3:** Commit: `feat(campaigns): CRUD + launch/pause/resume lifecycle`.

### Task 28: CampaignRun model (one per launch)

- [ ] **Step 1:** A `CampaignRun` records launch metadata and rollup stats independently of campaign edits over time.
- [ ] **Step 2:** Failing test, implement, commit: `feat(campaigns): campaign runs`.

## Sub-phase 1L — Call Worker Bootstrap

### Task 29: Bootstrap `apps/call-worker`

**Files:**
- Create: `apps/call-worker/{package.json,tsconfig.json,vitest.config.ts}`
- Create: `apps/call-worker/src/index.ts`

- [ ] **Step 1:** Worker entry: connect Mongo + Redis, preload Silero VAD ONNX model, start ws server on `CALL_WORKER_PORT`, start BullMQ consumers.
- [ ] **Step 2:** Smoke test — `pnpm --filter call-worker dev` boots, logs `worker ready`, accepts a `wss` upgrade on `/voice/:callJobId` with a 404 if the job doesn't exist.
- [ ] **Step 3:** Commit: `feat(call-worker): bootstrap process`.

### Task 30: BullMQ queue definitions in shared lib

**Files:**
- Create: `apps/api/src/lib/queues.ts`, `apps/call-worker/src/jobs/queues.ts` (duplicate names, shared via `packages/shared-utils`)

- [ ] **Step 1:** Define `callQueue`, `postCallQueue`, `recordingQueue` with `prefix: env.BULLMQ_PREFIX` and job schemas (zod).
- [ ] **Step 2:** Commit: `feat: BullMQ queue definitions`.

## Sub-phase 1M — Outbound Origination

### Task 31: Per-company concurrency cap + Twilio origination RPS (Redis Lua)

**Files:**
- Create: `apps/call-worker/src/concurrency/perCompanyCap.lua`, `originationRps.lua`, `gate.ts`, tests

- [ ] **Step 1: Failing test** — 51 simultaneous `tryAcquire(companyId)` calls succeed 50 times and fail once; `release()` frees a slot. RPS bucket allows exactly N tokens per second.
- [ ] **Step 2:** Implement atomic Lua scripts loaded once at worker boot; expose `gate.acquireOriginationSlot(companyId)` returning a release function or `null`.
- [ ] **Step 3:** Commit: `feat(call-worker): redis-backed concurrency + RPS gating`.

### Task 32: Twilio REST origination

**Files:**
- Create: `apps/call-worker/src/jobs/call.ts`, `apps/call-worker/src/providers/twilioClient.ts`, tests

- [ ] **Step 1: Failing test** — given a `call` job `{customerId, campaignId, contactChannelId}`, the consumer (with twilio client mocked) calls `client.calls.create({to, from, url: '<API>/twiml/voice/:callJobId', statusCallback: '<API>/webhooks/twilio/status', machineDetection: env.TWILIO_AMD_MODE})`, persists a `Call` record in `initiated` state with the returned `callSid`.
- [ ] **Step 2:** Implement; respect `gate.acquireOriginationSlot()` — if `null`, requeue with delay.
- [ ] **Step 3:** Commit: `feat(call-worker): twilio outbound origination`.

### Task 33: Call model

```ts
const CallSchema = new Schema({
  companyId, campaignId, campaignRunId, customerId, contactChannelId,
  direction: { enum: ['outbound','inbound'], default: 'outbound' },
  callSid: { type: String, index: true },
  callJobId: { type: String, unique: true },     // our own id, passed to twilio webhooks
  status: { enum: ['initiated','ringing','answered','in_progress','completed','failed','no_answer','busy','answering_machine','disconnected_worker_crash'] },
  answeredBy: String,
  startedAt: Date, answeredAt: Date, endedAt: Date,
  durationSec: Number,
  recordingUrl: String,
  transcript: [{ role: { enum: ['agent','customer','system'] }, text: String, at: Date }],
  summary: String,
  sentiment: { enum: ['positive','neutral','negative'] },
  extractedData: Schema.Types.Mixed,
  leadScore: Number,
  leadQualification: { enum: ['cold','warm','hot'] },
  outcome: String,
  retryCount: { type: Number, default: 0 },
  error: { code: String, message: String },
}, { timestamps: true });
```

- [ ] **Step 1:** Schema + repo + indexes (`companyId+campaignId+createdAt`, `companyId+leadQualification`, `callSid`).
- [ ] **Step 2:** Commit: `feat(calls): call model`.

## Sub-phase 1N — TwiML Endpoint + Webhooks

### Task 34: Twilio signature validation middleware

**Files:**
- Create: `apps/api/src/middleware/twilioSignature.ts`, tests

- [ ] **Step 1: Failing test** — request without `X-Twilio-Signature` → 403; with valid signature (computed from `TWILIO_AUTH_TOKEN` and full URL + sorted form params) → next().
- [ ] **Step 2:** Use the official `twilio.validateRequest()`. Apply only to `/twiml/*` and `/webhooks/twilio/*` routes.
- [ ] **Step 3:** Commit: `feat(api): twilio signature middleware`.

### Task 35: TwiML endpoint

**Files:**
- Create: `apps/api/src/routes/twiml.ts`, tests

- [ ] **Step 1: Failing test** — `POST /twiml/voice/:callJobId` (valid signature, callJobId resolves) returns 200 `application/xml` containing `<Response><Connect><Stream url="wss://${TWILIO_MEDIA_STREAM_WS_HOST}/voice/${callJobId}"/></Connect></Response>`. Unknown callJobId → `<Response><Hangup/></Response>`.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Commit: `feat(api): TwiML endpoint`.

### Task 36: Twilio status callback handler

- [ ] **Step 1: Failing test** — `POST /webhooks/twilio/status` with `{CallSid, CallStatus, AnsweredBy, CallDuration}` updates the `Call` record. AnsweredBy `machine_end_*` marks the call as `answering_machine` and enqueues hangup.
- [ ] **Step 2:** Implement. Commit: `feat(api): twilio status callback`.

## Sub-phase 1O — Media Streams WebSocket Server

### Task 37: Raw `ws` upgrade server in worker

**Files:**
- Create: `apps/call-worker/src/ws/mediaStreamServer.ts`, tests

- [ ] **Step 1: Failing test** — upgrade to `/voice/<unknown>` is rejected with 404 close code; upgrade to `/voice/<known>` is accepted; first message `{event:'start', start:{streamSid,callSid}}` binds the call session.
- [ ] **Step 2:** Implement. Validate callJobId against an in-process registry populated when the BullMQ job started; reject if not found.
- [ ] **Step 3:** Commit: `feat(call-worker): media streams ws server`.

## Sub-phase 1P — CallSession + VAD

### Task 38: Silero VAD wrapper

**Files:**
- Create: `apps/call-worker/src/audio/vad.ts`, tests, `apps/call-worker/models/silero_vad.onnx` (downloaded)

- [ ] **Step 1: Failing test** — feed VAD a known speech WAV → `isSpeech()` returns true on speech frames, false on silence; cold-start latency <300ms post-preload.
- [ ] **Step 2:** Implement using `onnxruntime-node`; expose `vad.process(pcm16Frame)` → `'speech'|'silence'` plus a `Detector` class wrapping rolling state with configurable 250ms silence-trailing trigger and 100ms speech pre-roll.
- [ ] **Step 3:** Commit: `feat(call-worker): silero VAD`.

### Task 39: μ-law ↔ PCM16 codec

**Files:**
- Create: `apps/call-worker/src/audio/mulaw.ts`, tests

- [ ] **Step 1: Failing test** — round-trip a known μ-law buffer through `decode → encode` is bit-identical (with tolerance: ITU-T G.711 is lossless for u-law byte values).
- [ ] **Step 2:** Implement lookup-table-based codecs. Commit: `feat(call-worker): mulaw codec`.

### Task 40: CallSession state machine — scaffold

**Files:**
- Create: `apps/call-worker/src/session/CallSession.ts`, tests

- [ ] **Step 1: Failing test** — given a fake Twilio WS, a `CallSession` instance receives `start` event, transitions to `awaiting_initial_utterance`, and sends nothing yet.
- [ ] **Step 2:** Implement skeleton: `enum CallState { awaiting_call_start, awaiting_initial_utterance, listening, thinking, speaking, ended }`. Hold references to Twilio WS, callJobId, customer, campaign config.
- [ ] **Step 3:** Commit: `feat(call-worker): CallSession scaffold`.

### Task 41: Inbound media frame handling

- [ ] **Step 1: Failing test** — `media` event with base64 μ-law payload is decoded, fed to VAD; on detected utterance end, `onUtterance(pcm16Buffer)` callback fires with combined buffer.
- [ ] **Step 2:** Implement ring buffer with pre-roll. Commit: `feat(call-worker): inbound frame ingestion + utterance assembly`.

## Sub-phase 1Q — STT Integration

### Task 42: OpenAI STT client

**Files:**
- Create: `apps/call-worker/src/stt/openAiSttClient.ts`, tests

- [ ] **Step 1: Failing test** — given a mocked OpenAI client, `transcribe(pcm16Buffer)` returns the transcript string; respects a 3s timeout; on timeout returns `null` and increments a counter.
- [ ] **Step 2:** Implement using OpenAI SDK `audio.transcriptions.create({ model: 'gpt-4o-transcribe', file })`. Input is PCM16 wrapped in a minimal WAV header.
- [ ] **Step 3:** Commit: `feat(call-worker): OpenAI STT client`.

### Task 43: Wire STT into CallSession

- [ ] **Step 1: Failing test** — on utterance end, STT is called, result appended to `session.history` as a `customer` message; empty/null result triggers "I didn't catch that" path only after 2 consecutive nulls.
- [ ] **Step 2:** Implement. Commit: `feat(call-worker): STT in conversation loop`.

## Sub-phase 1R — TTS Streaming

### Task 44: ElevenLabs WS streaming client

**Files:**
- Create: `apps/call-worker/src/tts/elevenLabsClient.ts`, tests

- [ ] **Step 1: Failing tests** — opens WS to `wss://api.elevenlabs.io/v1/text-to-speech/:voiceId/stream-input?model_id=eleven_flash_v2_5&output_format=ulaw_8000&optimize_streaming_latency=3`; `sendText(chunk)` writes `{text}`; on receive, μ-law base64 frames forwarded to a callback; `close()` flushes.
- [ ] **Step 2:** Implement with retry-once-on-disconnect. Commit: `feat(call-worker): ElevenLabs streaming client`.

### Task 45: Outbound frame backpressure handling

- [ ] **Step 1: Failing test** — when Twilio WS `bufferedAmount > 50KB`, new TTS frames are dropped (counter incremented), not buffered indefinitely.
- [ ] **Step 2:** Implement. Commit: `feat(call-worker): outbound backpressure`.

## Sub-phase 1S — LLM Streaming + Barge-in

### Task 46: Pipeline LLM tokens directly into TTS

- [ ] **Step 1: Failing test** — given a mock `AIProvider.completeStream()` yielding `['Hello',' ','there','!']`, the ElevenLabs client receives `sendText('Hello')`, `sendText(' there')`, `sendText('!')` in order.
- [ ] **Step 2:** Implement: as soon as LLM yields a token, write to ElevenLabs WS without waiting for full completion. Track an `utteranceId` so late chunks from a cancelled utterance can be dropped.
- [ ] **Step 3:** Commit: `feat(call-worker): LLM→TTS pipelining`.

### Task 47: Barge-in

- [ ] **Step 1: Failing test** — while `state === speaking`, a VAD `speech` event triggers: ElevenLabs WS closed, outbound TTS queue cleared, Twilio `{event:'clear',streamSid}` sent, transition to `listening`.
- [ ] **Step 2:** Implement. Late TTS frames belonging to old utteranceId are discarded.
- [ ] **Step 3:** Commit: `feat(call-worker): barge-in`.

### Task 48: AMD-aware start gating

- [ ] **Step 1: Failing test** — until Twilio status callback delivers `AnsweredBy=human` (or AMD complete), `CallSession` does not send greeting audio. If `AnsweredBy=machine_end_silence` (or any machine_*), session ends call with hangup.
- [ ] **Step 2:** Implement coordination via Redis pub/sub from API → worker keyed on callSid.
- [ ] **Step 3:** Commit: `feat(call-worker): AMD-aware greeting`.

## Sub-phase 1T — Recording

### Task 49: Raw μ-law dual-track capture

- [ ] **Step 1: Failing test** — during a session, inbound frames append to `data/recordings/<callId>/inbound.ulaw`, outbound frames append to `outbound.ulaw`. On session end, files closed and a `recording` job enqueued.
- [ ] **Step 2:** Implement using `fs.createWriteStream` with `flags: 'a'`. Commit: `feat(call-worker): raw recording capture`.

### Task 50: Recording mux job (ffmpeg)

**Files:**
- Create: `apps/post-call-worker/src/jobs/recordingMux.ts`, tests

- [ ] **Step 1: Failing test** — given two μ-law files, the job invokes ffmpeg to produce a stereo MP3 (`-channel_layout stereo -map 0 -map 1 -c:a libmp3lame -b:a 64k`), writes to storage, updates `Call.recordingUrl`. Deletes raw files after 24h.
- [ ] **Step 2:** Implement. Commit: `feat(post-call): recording mux`.

## Sub-phase 1U — Call Records (Summary, Extraction, Lead Score)

### Task 51: Per-turn transcript persistence

- [ ] **Step 1: Failing test** — each `agent` or `customer` turn writes to `Call.transcript` via a fire-and-forget bounded async queue (max 100 pending writes per call; on overflow, drop with warning, do not block).
- [ ] **Step 2:** Implement. Commit: `feat(call-worker): transcript writes (non-blocking)`.

### Task 52: Post-call summary job

**Files:**
- Create: `apps/post-call-worker/src/jobs/summarize.ts`, tests

- [ ] **Step 1: Failing test** — given a transcript, the AIProvider's `summarize()` is called; result + sentiment (derived via simple prompt) written to `Call.summary`, `Call.sentiment`, `Call.outcome`.
- [ ] **Step 2:** Implement. Commit: `feat(post-call): summarize`.

### Task 53: Structured data extraction job

- [ ] **Step 1: Failing test** — for a campaign with `agent.extractionSchema = {fields:[{key:'income',type:'number'},{key:'interested',type:'boolean'}]}`, given a transcript that mentions both, the job populates `Call.extractedData = {income: 75000, interested: true}` and validates the result.
- [ ] **Step 2:** Implement via `AIProvider.extract()` with JSON-mode forcing. Commit: `feat(post-call): structured extraction`.

### Task 54: Lead scoring job

- [ ] **Step 1: Failing test** — given `agent.leadScoringRules = [{when:'interested == true', points:40},{when:'income > 50000', points:30}]` and extracted data with both true → `Call.leadScore = 70`, `Call.leadQualification = 'warm'`. Score 71-100 → `hot`, 0-30 → `cold`.
- [ ] **Step 2:** Implement using `expr-eval` for safe rule evaluation. Commit: `feat(post-call): lead scoring`.

### Task 55: Wire post-call jobs into session end

- [ ] **Step 1: Failing test** — on session end, three jobs enqueued in order: `summarize` → `extract` → `leadScore` (chained via dependent jobs in BullMQ flows).
- [ ] **Step 2:** Implement. Commit: `feat: chain post-call processing`.

### Task 56: Retry on no-answer / busy

- [ ] **Step 1: Failing test** — Twilio status `no-answer`/`busy` → if `Call.retryCount < campaign.retryRules.maxRetries`, enqueue a delayed `call` job with `delay = campaign.retryRules.retryAfterHours * 3600 * 1000` and increment retryCount.
- [ ] **Step 2:** Implement. Commit: `feat: retry logic`.

## Sub-phase 1V — Real-time Monitoring (Socket.IO)

### Task 57: Socket.IO server in API

**Files:**
- Create: `apps/api/src/lib/socket.ts`, tests

- [ ] **Step 1: Failing test** — client connects with JWT in handshake; joins room `company:<companyId>`; receives events emitted to that room; rejected if JWT invalid.
- [ ] **Step 2:** Implement; use Redis adapter for horizontal scale.
- [ ] **Step 3:** Commit: `feat(api): socket.io with redis adapter + jwt auth`.

### Task 58: Worker publishes call events

- [ ] **Step 1: Failing test** — on each turn, worker `publish` via Redis to channel `socket:company:<companyId>` payload `{type:'call.turn', callId, role, text, at}`. API's socket layer subscribes and forwards to room.
- [ ] **Step 2:** Implement. Also emit `call.started`, `call.ended`, `call.failed`.
- [ ] **Step 3:** Commit: `feat: real-time call event stream`.

### Task 59: Pause/stop active call from API

- [ ] **Step 1: Failing test** — `POST /calls/:id/stop` publishes `worker-control:<callId>` `{action:'hangup'}`; worker session hears, closes ElevenLabs, sends Twilio hangup, ends session.
- [ ] **Step 2:** Implement. Commit: `feat: manual call control`.

## Sub-phase 1W — Frontend Bootstrap

### Task 60: Vite + React + TS + Tailwind + Shadcn

**Files:**
- Create: `apps/web/{package.json,vite.config.ts,tsconfig.json,tailwind.config.ts,postcss.config.js,index.html,src/main.tsx,src/app/App.tsx,src/styles/globals.css}`

- [ ] **Step 1:** `pnpm create vite apps/web -- --template react-ts` then convert to workspace package.
- [ ] **Step 2:** Add Tailwind + Shadcn CLI init (`npx shadcn@latest init` with neutral palette, css variables, default radius). Vite proxy `/api` → `http://localhost:4000`, `/ws` → `http://localhost:4000`.
- [ ] **Step 3:** Smoke test: `pnpm --filter web dev`, open localhost:5173, see Vite welcome.
- [ ] **Step 4:** Commit: `feat(web): vite + tailwind + shadcn bootstrap`.

### Task 61: Router, providers, dark mode

**Files:**
- Create: `apps/web/src/app/{router.tsx,providers.tsx,Layout.tsx,ProtectedRoute.tsx}`

- [ ] **Step 1:** React Router 6 with file-by-route, TanStack Query provider, Zustand auth store, `next-themes` for dark mode.
- [ ] **Step 2:** Commit: `feat(web): router + global providers`.

### Task 62: API client + auth interceptors

**Files:**
- Create: `apps/web/src/lib/{api.ts,socket.ts,authStore.ts}`, tests (vitest + msw)

- [ ] **Step 1: Failing test** — `api.get('/x')` includes `Authorization: Bearer <accessToken>`; on 401, attempts refresh once; on refresh fail, calls `authStore.logout()`.
- [ ] **Step 2:** Implement using `ky` or `axios` with interceptors. Commit: `feat(web): api client + refresh flow`.

## Sub-phase 1X — Frontend Auth + Dashboard Shell

### Task 63: Login + Signup pages

- [ ] **Step 1:** Implement login + signup pages with React Hook Form + Zod, error states, loading states, accessible labels. Tailwind + Shadcn components (Input, Button, Card).
- [ ] **Step 2:** E2E sanity: signup → land on dashboard. Commit: `feat(web): auth pages`.

### Task 64: Dashboard layout (sidebar + topbar + command palette)

- [ ] **Step 1:** Sidebar with sections (Customers, Campaigns, Calls, Voices, AI Providers, Channels, Settings). Topbar with user menu + theme toggle + search. Command palette via `cmdk`.
- [ ] **Step 2:** Commit: `feat(web): dashboard shell`.

## Sub-phase 1Y — Frontend Feature Pages

### Task 65: Customers page (list, create, edit, import)

- [ ] **Step 1:** TanStack Query table with pagination/search/filter. Drawer for create/edit (RHF). Import via drag-drop CSV with row preview + import progress polling.
- [ ] **Step 2:** Commit: `feat(web): customers UI`.

### Task 66: Campaign builder

- [ ] **Step 1:** Stepper form: Basics → Customer List → AI Agent (prompt + voice + provider) → Channel → Schedule → Review. Save-as-draft on each step. Launch button calls API.
- [ ] **Step 2:** Commit: `feat(web): campaign builder`.

### Task 67: Live call monitor

- [ ] **Step 1:** List of in-progress calls (Socket.IO `call.started`); click row → drawer with live transcript (Socket.IO `call.turn`) + Stop button.
- [ ] **Step 2:** Commit: `feat(web): live call monitor`.

## Sub-phase 1Z — Call Detail + Polishing

### Task 68: Call detail page

- [ ] **Step 1:** Two-column layout: left = audio player (recording URL) + metadata (duration, status, lead score, extracted data); right = transcript with role badges + timestamps.
- [ ] **Step 2:** Commit: `feat(web): call detail`.

### Task 69: Empty states + skeleton loaders + toasts

- [ ] **Step 1:** Empty-state components for every list view; skeleton loaders during query loading; `sonner` toasts for success/error.
- [ ] **Step 2:** Commit: `feat(web): empty states + skeletons + toasts`.

### Task 70: Phase 1 acceptance test (end-to-end)

**Manual + Playwright (deferred):**

1. Boot all three apps + docker compose.
2. Signup → land on dashboard.
3. Configure: add Twilio channel, ElevenLabs voice profile (default), OpenAI provider.
4. Import 5 customers via CSV.
5. Create campaign with system prompt "You are Sarah from ABC. Ask name, interest, budget. Keep <2 min."
6. Launch campaign. Watch monitor: 5 calls dispatch (RPS gated), each shows live transcript.
7. After all complete: call detail shows recording, transcript, summary, extracted `{name, interest, budget}`, lead score, classification.

If all pass → Phase 1 complete.

- [ ] **Step 1:** Run the manual sequence; document results in `docs/phase-1-acceptance.md`.
- [ ] **Step 2:** Tag release: `git tag v0.1.0-phase1`.

---

# PHASE 2 — WhatsApp AI Chat (Milestones)

**Goal:** Add Meta WhatsApp Business API as a campaign channel for text-only AI conversations.

**Acceptance:** A campaign of type `whatsapp_chat` can be launched against a customer list with WhatsApp numbers; inbound messages drive an LLM-streamed response back; conversations stored as `Chat` with transcripts; live monitor shows chats in real time.

**Milestones:**
1. Meta Business Cloud API integration — verify webhook, send/receive messages, template approval flow for outbound-initiated chats (24h session rules).
2. `Chat` and `ChatMessage` models mirroring `Call`/transcript.
3. `chat-worker` process — similar to call-worker but text-only; no VAD/STT/TTS.
4. Reuse `AIProvider` for completion; same summarization + extraction + lead scoring pipeline.
5. Webhook routes `/webhooks/meta/whatsapp` with X-Hub signature validation.
6. Frontend: WhatsApp tab in monitor, chat-bubble UI in detail.
7. Session window awareness (Meta's 24h customer-initiated rule + template messages for re-engagement).
8. Per-tenant Meta credential storage (encrypted, like AI provider keys).

Expand into a dedicated plan before execution.

---

# PHASE 3 — WhatsApp Voice Calls (Milestones)

**Goal:** Outbound WhatsApp voice calls via Meta's Calling API (or Vonage/Plivo fallback).

**Acceptance:** A campaign of type `whatsapp_call` originates voice calls; reuses the call-worker pipeline for audio (VAD/STT/LLM/TTS) but with Meta media stream protocol instead of Twilio's.

**Milestones:**
1. Provider abstraction for telephony: `TelephonyProvider` with implementations `TwilioTelephony`, `MetaWhatsAppTelephony`, `VonageTelephony`, `PlivoTelephony` (Phase 2 of abstraction; for Phase 1 only Twilio).
2. Map Meta WhatsApp call media protocol → unified audio frame interface.
3. New worker bootstrap that selects provider by channel type.
4. Vonage/Plivo only as opt-in; behind feature flag.

---

# PHASE 4 — Hybrid Routing + Fallback (Milestones)

**Goal:** Campaigns of type `hybrid` define `primaryChannel` + `fallbackChannels: [...]` and an ordered escalation policy.

**Acceptance:** Customer not reached on WhatsApp voice → attempts phone call → attempts WhatsApp chat → schedules callback; all attempts grouped under one `Engagement` record.

**Milestones:**
1. `Engagement` model groups multiple call/chat attempts per (campaign, customer).
2. `RoutingEngine` evaluates next channel based on previous outcome.
3. Configurable rules per campaign (no-answer → fallback, busy → retry, refused → stop).
4. UI for designing fallback chains visually.

---

# PHASE 5 — RAG Knowledge Base (Milestones)

**Goal:** Companies upload PDFs/DOCX/URLs; AI agents can ground answers in this knowledge.

**Acceptance:** A campaign's system prompt has access to a "knowledge base" toggle; during conversation, before LLM call, top-k retrieved chunks are injected; cited in extracted data.

**Milestones:**
1. `KnowledgeBase`, `KnowledgeDocument`, `KnowledgeChunk` models with embeddings (use Mongo Atlas Vector Search or pgvector if migrating).
2. Ingestion worker: download → parse (pdf-parse, mammoth, cheerio) → chunk (semantic) → embed (OpenAI text-embedding-3-small) → store.
3. Retrieval helper used by `AIProvider.completeStream` via a `context` parameter.
4. UI for uploading docs + watching ingestion progress + viewing parsed chunks.

---

# PHASE 6 — Analytics + Insights (Milestones)

**Goal:** Executive-grade reporting per campaign and per company.

**Acceptance:** Dashboard shows total conversations, connect/response/conversion rates, sentiment trends, lead qualification rates, per-channel comparisons, daily/weekly/monthly trends, exportable to CSV/PDF.

**Milestones:**
1. Materialized rollup collections updated by a `analytics-aggregator` BullMQ cron job (hourly + daily).
2. Recharts dashboards: time-series, funnel, comparison tables.
3. Saved views + scheduled email reports.
4. Cost analytics: per-call cost (Twilio + ElevenLabs + OpenAI tokens × per-token cost) and per-campaign ROI calculation.

---

# PHASE 7 — Billing + Subscriptions (Milestones)

**Goal:** Stripe-managed subscriptions with usage-based metering for call minutes and AI tokens.

**Acceptance:** Plans (Starter / Pro / Enterprise) gate seat counts, campaign concurrency, monthly call-minute caps; Stripe customer portal for self-serve; metered usage reported nightly.

**Milestones:**
1. `Subscription`, `Invoice`, `UsageRecord` models.
2. Stripe webhooks for subscription lifecycle (signature-validated).
3. Quota enforcement middleware: before campaign launch and call origination.
4. Daily metering job reports usage to Stripe.
5. Pricing/upgrade UI; Stripe Checkout integration.

---

# PHASE 8 — Marketing Site + Landing Page (Milestones)

**Goal:** A premium, conversion-optimised marketing site at the apex domain.

**Acceptance:** Public site at `/` (separate from `/app` SPA) with hero, features, channels, voices, providers, dashboard showcase, analytics showcase, testimonials, pricing, FAQ, contact-sales, footer. Lighthouse score ≥ 95 on perf/accessibility/SEO.

**Milestones:**
1. Decide framework — likely Next.js app router (SSR/SSG for SEO) as a sibling app `apps/marketing`.
2. Hero with animated dashboard mock (Framer Motion).
3. Logo cloud + testimonials (CMS-driven or hardcoded initially).
4. Pricing table sourced from Stripe Products.
5. Contact-sales form → email + CRM webhook.
6. Cookie/consent banner.
7. Deploy under same domain via Nginx routing (`/` → marketing, `/app` → SPA, `/api` → api).

---

# Verification (Cross-Phase)

**Per-task verification:** Each task's tests must pass (`pnpm --filter <pkg> test`) and lint clean (`pnpm lint`) before commit.

**Per-phase verification:**
- **Phase 1:** Run the end-to-end script in Task 70. All seven steps pass without manual intervention beyond what's listed.
- **Phase 2/3:** Mirror Task 70 with a WhatsApp campaign; both text and voice paths produce correct transcripts, summaries, extracted data.
- **Phase 4:** Hybrid campaign reaches a customer via a fallback after primary fails — verifiable in the Engagement view.
- **Phase 5:** Upload a KB doc with a specific fact (e.g., "our refund window is 30 days"); ask the agent during a call — agent grounds answer in the KB.
- **Phase 6:** After 100 dispatched calls, dashboard correctly shows totals and trends matching raw DB queries.
- **Phase 7:** Subscribe to Pro plan via Stripe test mode; quota enforcement blocks the 51st concurrent call (Pro = 50 cap, hypothetical); usage shows in Stripe portal.
- **Phase 8:** Lighthouse audit ≥ 95 across perf/a11y/SEO/best-practices on `/`.

**Security checklist (recur at every phase):**
- Tenant isolation tests on every new model.
- Encryption-at-rest tests on every new credential type.
- Rate limits on every new public endpoint.
- Webhook signature validation on every new external webhook.
- No PII in logs (Pino redact list updated per phase).

**Cost / observability (deferred but earmarked):**
- OpenTelemetry traces span the call lifecycle (call origination → STT → LLM → TTS → recording mux).
- Per-call cost computed and stored on `Call.costBreakdown` for Phase 6 rollups.

---

# Open Questions / Decisions Deferred

1. **Hosting target:** Plan assumes single-region deploy (AWS ECS or Fly.io). Multi-region voice routing is out of scope; revisit in Phase 8 if call origination latency to non-US customers becomes an issue.
2. **Recording storage:** Phase 1 uses `STORAGE_DRIVER=local`. Switching to S3 needs an `S3StorageDriver` implementation behind the existing `Storage` interface — earmark for end of Phase 1 if doing more than local dev.
3. **STT alternative:** If `gpt-4o-transcribe` p95 latency proves too high in real-world testing during Phase 1U/V, swap `OpenAiSttClient` for a Deepgram streaming implementation (the `AIProvider` interface is already designed to allow it).
4. **Frontend SSR:** SPA-only for Phase 1; the marketing site in Phase 8 introduces Next.js. The dashboard SPA stays Vite — no premature SSR.

---

**End of plan.** Save target: this file `/home/nurulkomor/.claude/plans/create-plan-with-this-delegated-manatee.md`. Recommended next action: when ready to execute, copy this plan into the project as `docs/superpowers/plans/2026-06-05-voiceflow-ai-master.md`, then break Phase 1 sub-phases into per-sub-phase plans (1A, 1B, …) for subagent-driven execution. Phases 2–8 each warrant their own brainstorming + plan pass when their turn comes.
