# EAIOS Threat Model & Security Policy

## 1. Trust Boundaries
- Client (Browser) <-> FastAPI Backend (HTTPS + JWT Authentication).
- FastAPI Backend <-> Third-Party APIs (OAuth 2.0 Tokens for Gmail, Slack, Drive, GitHub, Jira).
- FastAPI Backend <-> PostgreSQL + pgvector (Internal TLS connection).

## 2. Key Threats & Mitigations
- **Credential Leakage**: No secrets stored in git. Environment secrets managed via vault/secrets manager. OAuth tokens encrypted at rest in PostgreSQL using AES-256-GCM.
- **Unauthorized Data Access**: Tenant level data isolation in RAG vector database. All query vectors filtered by user organizational permissions.
- **Prompt Injection**: Input validation and sanitization on user queries passed to LLMs. Strict tool execution permission models.
- **Dependency Vulnerabilities**: Automated dependency scanning in CI pipeline via `pip-audit` and `npm audit`.
