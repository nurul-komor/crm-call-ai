# VoiceFlow AI

Multi-tenant SaaS for automating customer conversations via AI: outbound phone calls (Phase 1), WhatsApp voice + chat (Phases 2–3), with hybrid routing, RAG, analytics, billing, and a marketing site (Phases 4–8).

> **Implementation roadmap:** see [`PLAN.md`](./PLAN.md). Phase 1 is broken into ~70 bite-sized TDD tasks across sub-phases 1A–1Z; Phases 2–8 are scoped as milestone lists.

## Stack

- **Frontend** — React 18 · TypeScript · Vite · TailwindCSS · Shadcn/UI · Framer Motion · TanStack Query · React Hook Form + Zod · Recharts · Zustand · Socket.IO client
- **Backend** — Node 20 · Express · TypeScript · Mongoose · Redis · BullMQ · Socket.IO · Zod · Pino
- **Voice / AI** — Twilio Programmable Voice + Media Streams (μ-law 8 kHz) · ElevenLabs (`eleven_flash_v2_5`) · OpenAI (`gpt-4o-transcribe` STT, `gpt-4o-mini` LLM, with a swappable `AIProvider` interface for Claude / Gemini / OpenRouter)
- **Infra** — Docker Compose for local dev (mongo / redis / mailhog), Nginx for prod

## Repository layout

```
apps/
  api/                # Express HTTP API (:4000)
  call-worker/        # BullMQ + raw ws server for live calls (:4100)
  post-call-worker/   # Summarization, extraction, recording mux
  web/                # Vite/React SPA (:5173)
packages/
  shared-types/       # DTOs + Zod schemas shared API ↔ Web
  shared-config/      # eslint / prettier / tsconfig presets
  shared-utils/       # Pure helpers (crypto, tenant scope, ...)
services/
  docker/             # Mongo init scripts, nginx confs
docker-compose.yml
PLAN.md
```

## Quickstart (local dev)

```bash
# 1. Tools — Node 20 LTS, pnpm 9, Docker.
nvm use            # picks up .nvmrc (20.11.1)
corepack enable    # picks up packageManager (pnpm@9.0.0)

# 2. Install
pnpm install

# 3. Local infra (mongo + redis + mailhog)
#    - If you already run these on the host on standard ports (27017/6379/1025/8025),
#      skip this step and use the host services directly. The default .env.example
#      points at the host.
#    - Otherwise:
pnpm docker:up
#      docker-compose remaps ports to 27018 / 6380 / 1026 / 8026 to avoid host
#      collisions. Update MONGO_URI / REDIS_URL / SMTP_PORT in .env accordingly.

# 4. Configure
cp .env.example .env
# Fill in JWT_*_SECRET, ENCRYPTION_MASTER_KEY (see comments inside .env.example),
# and external API keys (TWILIO_*, ELEVENLABS_API_KEY, OPENAI_API_KEY) when ready.

# 5. Run everything in parallel
pnpm dev
```

API health check: `curl http://localhost:4000/api/v1/health` → `{"status":"ok"}`.

## Useful scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run every app in dev mode (parallel) |
| `pnpm build` | Build every app |
| `pnpm test` | Run vitest across every package |
| `pnpm lint` | Lint everything |
| `pnpm typecheck` | Project-wide TypeScript check |
| `pnpm docker:up` / `:down` / `:logs` | Local infra control |

## Security notes

The Mongo connection string previously committed to `.env` used weak credentials. **Rotate the Atlas password and tighten the IP allowlist before any non-local deploy.** See `PLAN.md` Task 0.

`.env` is gitignored. Only `.env.example` is committed.

## License

Proprietary — all rights reserved.
