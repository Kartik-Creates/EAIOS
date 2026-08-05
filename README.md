<div align="center">

# UnifyAi

**One AI platform that connects your entire company.**

*An AI-native operating layer over Gmail, Slack, Google Drive, GitHub, and Jira — search, summarize, and act, all from one interface.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://react.dev/)
[![Database: PostgreSQL + pgvector](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-336791.svg)](https://github.com/pgvector/pgvector)

</div>

---

## Table of contents

- [What is UnifyAi?](#what-is-unifyai)
- [Core features](#core-features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Security & compliance](#security--compliance)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

---

## What is UnifyAi?

Modern companies don't suffer from a lack of software — they suffer from having **too much of it**. Documents live in Drive, conversations live in Slack, tickets live in Jira, code lives in GitHub, and no single tool understands how they all connect.

**UnifyAi** is an AI-native platform that sits on top of the tools a company already uses, instead of replacing them. It gives every employee one interface to:

- Ask questions about company knowledge and get **cited, sourced answers** — not guesses
- Get a live, personalized **daily briefing** pulled from their actual Jira tickets, unread email, open PRs, and calendar
- Trigger multi-step **workflows** (like applying for leave) with a human confirming every action before it's taken
- Search across every connected tool semantically, not just by keyword

Every AI decision in UnifyAi is logged, explainable, and — for anything that writes data — requires explicit human confirmation. The system is built to be genuinely trustworthy in an enterprise setting, not just a impressive demo.

---

## Core features

| Module | What it does |
|---|---|
| 🧠 **Company Brain** | RAG-based Q&A over company documents, with source citations and a confidence guardrail that refuses to guess when no real answer exists |
| 🔍 **Enterprise Search** | Semantic search across connected tools — finds the right document even if it never uses your exact search words |
| 📅 **Daily Briefing** | A live, tool-calling agent that checks Jira, Gmail, GitHub, and Calendar in parallel and tells you what actually needs your attention today |
| 🎙️ **Meeting Intelligence** | Ingests meeting transcripts (manual upload, Zoom, and Google Meet via Drive), extracts decisions and action items, and feeds them into the same reasoning layer as your live tools |
| ⚙️ **Workflow Automation** | An agent that can trigger real actions (like a leave request) using a fixed, explicit tool menu — every write action requires human confirmation first |
| 🔌 **Integrations** | One-click OAuth connections to Gmail, Google Drive, GitHub, Slack, and Jira, built on a single reusable OAuth engine |
| 📊 **Executive Dashboard** | Pending approvals, AI usage, and team activity at a glance for managers |
| 🕵️ **AI Transparency Dashboard** | Every agent decision, its confidence score, and whether a human overrode it — full visibility into what the AI actually did |
| 🔐 **Role-Based Access** | Employee / Manager / HR / Admin permission tiers enforced at the API level, not just hidden in the UI |

---

## Architecture

UnifyAi is built as a **modular monolith**, not microservices — one deployable backend, cleanly separated into internal layers. This keeps the system simple enough for a small team to build and reason about, while leaving a clear path to split into real microservices later if a specific module needs to scale independently.

```
                         ┌──────────────────┐
                         │   API & Auth      │  JWT, RBAC, rate limiting
                         └────────┬──────────┘
                                  │
        ┌──────────────┬─────────┼──────────┬───────────────┐
        ▼              ▼         ▼          ▼               ▼
   AI Orchestration  Core API  Documents  Integrations   Workflow
   (RAG + agents)    routes    /ingest    (OAuth engine) engine
        │              │         │          │               │
        └──────────────┴─────────┴──────────┴───────────────┘
                                  │
                         ┌────────┴─────────┐
                         │   PostgreSQL      │  + pgvector (embeddings)
                         │   + Redis         │  (cache, rate limits, JTI)
                         └───────────────────┘
```

**Non-negotiable design principle:** the LLM never directly executes a write action, a policy change, or a payout. Every action passes through deterministic backend logic, and anything that writes data requires explicit human confirmation. This isn't a limitation — it's what makes an AI agent safe to trust with real company systems.

---

## Tech stack

**Frontend**
- React 19 + TypeScript
- TanStack Start / Router (file-based routing)
- TanStack Query (data fetching & caching)
- Tailwind CSS v4 + Radix UI + shadcn/ui
- Zustand (global state)
- React Hook Form + Zod

**Backend**
- Python + FastAPI
- SQLAlchemy 2.0 (async) + Alembic
- PostgreSQL + `pgvector` (vector similarity search)
- Redis (rate limiting, refresh-token JTI tracking)
- JWT dual-token auth (short-lived access + rotating refresh tokens)
- AES-256-GCM field-level encryption for sensitive data

**AI**
- Google Gemini (chat generation + `gemini-embedding-001` embeddings) in production
- Ollama (local LLM + embeddings) for local development
- LangChain-style tool-calling for the agent layer

**Infra**
- Docker Compose (local development)
- Deployed on a fully free stack: Vercel (frontend) · Render (backend) · Supabase (Postgres + pgvector) · Upstash (Redis)

---

## Security & compliance

Security wasn't bolted on — it's been an active, tested part of the build from day one:

- ✅ Role-based access control (`require_role()`), enforced on every write endpoint, not just hidden in the UI
- ✅ Refresh Token Rotation with Redis JTI tracking — a stolen or replayed refresh token is rejected
- ✅ Field-level AES-256-GCM encryption for medical/PII-equivalent and OAuth token data
- ✅ Document-level permission filtering — retrieval is filtered by the requester's role **before** anything reaches the LLM, not after
- ✅ Rate limiting on authentication and AI endpoints
- ✅ Immutable, append-only audit log for every state-changing action
- ✅ Prompt-injection-safe framing — retrieved content is always passed to the LLM as data, never as instructions
- ✅ Explicit, adversarial RBAC boundary testing (cross-role access, cross-user data isolation, IDOR checks) — not just happy-path tests

---

## Getting started

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- Python 3.11+

### Local setup

```bash
# clone the repo
git clone https://github.com/Kartik-Creates/EAIOS.git
cd EAIOS

# copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# fill in backend/.env with local values (defaults work for local dev)

# bring up the full stack
docker-compose up -d

# run database migrations
docker-compose exec backend alembic upgrade head

# seed sample data
docker-compose exec backend python seed.py
```

The app will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs (Swagger): `http://localhost:8000/docs`

### Running tests

```bash
docker-compose exec backend pytest tests/ -v
```

---

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (with `+asyncpg` driver) |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing key — generate a strong unique value per environment |
| `ENCRYPTION_KEY` | AES field-level encryption key |
| `LLM_PROVIDER` | `ollama` (local dev) or `gemini` (production) |
| `EMBEDDING_PROVIDER` | `ollama` (local dev) or `gemini` (production) |
| `GEMINI_API_KEY` | Google Gemini API key (production) |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth (Drive, Gmail, Calendar) |
| `GITHUB_CLIENT_ID` / `SECRET` | GitHub OAuth |
| `SLACK_CLIENT_ID` / `SECRET` | Slack OAuth |
| `JIRA_CLIENT_ID` / `SECRET` | Atlassian OAuth |

**Never commit `.env` files.** Only `.env.example` files (with placeholder values) belong in version control.

---

## Deployment

UnifyAi is deployed entirely on free-tier infrastructure:

| Layer | Service |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL + pgvector) |
| Cache / rate limiting | [Upstash](https://upstash.com) (Redis) |
| LLM & embeddings | [Google Gemini API](https://aistudio.google.com) |

> **Note:** the free Render backend spins down after 15 minutes of inactivity and takes ~30–50 seconds to wake on the next request — a deliberate, accepted tradeoff for zero-cost hosting.

---

## Project structure

```
UnifyAi/
├── backend/
│   ├── app/
│   │   ├── core/          # config, security, dependencies
│   │   ├── db/             # session, base models
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API endpoints
│   │   └── services/       # business logic (RAG, briefing, OAuth, etc.)
│   ├── alembic/             # database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── routes/          # file-based pages
│       ├── components/      # reusable UI
│       ├── services/        # API client layer
│       └── store/           # Zustand stores
├── docs/                    # architecture docs, threat model
└── docker-compose.yml
```

---

## Roadmap

- [x] Company Brain (RAG chat with citations)
- [x] Enterprise Search
- [x] Daily Briefing agent (Jira, Gmail, GitHub, Calendar)
- [x] Generic OAuth integration engine
- [ ] Meeting Intelligence (Zoom, Google Meet, Microsoft Teams)
- [ ] Workflow Automation execution engine
- [ ] Executive Dashboard live data
- [ ] Confluence & Notion as additional knowledge sources

---

## License

This project is licensed under the [MIT License](./LICENSE).
