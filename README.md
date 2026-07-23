# EAIOS — Enterprise AI Operating System

EAIOS (Enterprise AI Operating System) is an AI-powered platform designed to unify enterprise knowledge and automate workflows by connecting Gmail, Slack, Google Drive, GitHub, and Jira through hybrid RAG-based search (retrieval-augmented generation) and autonomous multi-agent orchestration.

---

## 🛠 Tech Stack

- **Frontend**: React (TypeScript, Vite, Vanilla CSS)
- **Backend**: FastAPI (Python 3.11, Pydantic, SQLAlchemy Async)
- **Database**: PostgreSQL 16 with `pgvector` extension for relational data and high-dimensional vector embeddings
- **Caching & Async Task Queue**: Redis 7
- **DevOps & CI/CD**: Docker Compose, GitHub Actions

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Docker Engine & Docker Compose
- Node.js 20+ and Python 3.11+ (for local non-docker development)

### 1. Environment Setup
Copy the placeholder environment files to create local `.env` files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start Services via Docker Compose
Run the entire stack (PostgreSQL + pgvector, Redis, FastAPI Backend, React Frontend):
```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **FastAPI Backend Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/v1/health`

---

## 🗄 Database Migrations & Seeding

### Running Alembic Database Migrations
To apply database schema migrations using Alembic:
```bash
# Inside backend container or local backend environment:
cd backend
alembic upgrade head
```

### Creating New Migrations
```bash
cd backend
alembic revision --autogenerate -m "describe_migration"
```

---

## 👥 Team Guidelines & Branching Strategy

All team members must follow our team workflow rules. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for full instructions on:
- Branching conventions (`main`, `dev`, `feature/<name>-<description>`)
- Pull request approval policies (1 approval standard, 2 approvals required for auth/security/integrations)
- Code owners setup (`.github/CODEOWNERS`)
