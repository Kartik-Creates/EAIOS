# ADR 0001: Initial Technical Stack & Architecture Selection

- **Status**: Approved
- **Date**: 2026-07-23

## Context
EAIOS requires a scalable platform stack to ingest data across enterprise apps (Gmail, Slack, Drive, GitHub, Jira), index embeddings for RAG vector search, and execute agentic workflows.

## Decision
1. **Frontend**: React SPA for fast UI rendering and clean component modularity.
2. **Backend**: FastAPI (Python) for asynchronous performance, native Pydantic schema validation, and rich AI/ML ecosystem integration.
3. **Database**: PostgreSQL with `pgvector` to consolidate relational operational data and vector store embeddings in a unified ACID database.
4. **Caching & Task Queue**: Redis for fast session management and asynchronous background job queuing.

## Consequences
- Single primary database simplifies operations and backups.
- Python ecosystem provides direct support for LangChain/LlamaIndex embedding generation and vector ops.
