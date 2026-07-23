# EAIOS Architecture Overview

The Enterprise AI Operating System (EAIOS) connects workplace platforms (Gmail, Slack, Google Drive, GitHub, Jira) using RAG-based knowledge search and agentic workflow automation.

```
                     ┌──────────────────┐
                     │   React Frontend │
                     └────────┬─────────┘
                              │ REST / WebSockets
                     ┌────────▼─────────┐
                     │  FastAPI Backend │
                     └────┬─────────┬───┘
                          │         │
          ┌───────────────▼┐       ┌▼──────────────┐
          │ PostgreSQL     │       │ Redis Cache   │
          │ + pgvector     │       │ & Task Queue  │
          └────────────────┘       └───────────────┘
                                   ┌───────────────┐
                                   │ Integrations  │
                                   │ (Gmail, Slack,│
                                   │ Drive, GitHub,│
                                   │ Jira)         │
                                   └───────────────┘
```

## System Components

1. **Frontend**: React + TypeScript client providing unified UI for RAG search and agent workflow management.
2. **Backend**: FastAPI microservices supporting OAuth integrations, embedding processing, and agent orchestration.
3. **Database**: PostgreSQL with `pgvector` extension for structured business data and high-performance vector search embeddings.
4. **Cache & Queue**: Redis for session storage, query caching, and async task execution.
