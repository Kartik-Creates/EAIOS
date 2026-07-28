/**
 * api.ts
 *
 * Centralized API route constants.
 *
 * RULES:
 *  - Never hardcode these strings inside components, hooks, or services.
 *  - Never add an endpoint here that does not exist in the verified
 *    backend endpoint table (Section 8 of the roadmap).
 *  - Base URL comes from env var VITE_API_BASE_URL — never hardcoded.
 *
 * Route prefix: /api/v1  (defined once in axios.ts, not repeated here)
 * So these paths are RELATIVE to the /api/v1 prefix.
 */

// ─────────────────────────────────────────────
// AUTH  — router: backend/app/routers/auth.py
// ─────────────────────────────────────────────
export const API_ROUTES = {
  AUTH: {
    REGISTER:           '/auth/register',
    LOGIN:              '/auth/login',
    REFRESH:            '/auth/refresh',
    LOGOUT:             '/auth/logout',
    ME:                 '/auth/me',

    // OAuth — provider is injected at call-time
    // e.g. /auth/oauth/google/login  or  /auth/oauth/github/login
    OAUTH_LOGIN:        (provider: string) => `/auth/oauth/${provider}/login`,

    // Manual token (Slack / Jira only)
    CONNECTIONS_TOKEN:  '/auth/connections/token',

    // List all OAuth connections
    CONNECTIONS_LIST:   '/auth/connections',
  },

  // ───────────────────────────────────────────
  // CHAT — router: backend/app/routers/chat.py
  // Rate limited: 10 requests / minute per user
  // ───────────────────────────────────────────
  CHAT: {
    SEND:               '/chat',
  },

  // ───────────────────────────────────────────
  // SEARCH — router: backend/app/routers/search.py
  // Query params: ?q=...&top_k=...
  // ───────────────────────────────────────────
  SEARCH: {
    QUERY:              '/search',
  },

  // ───────────────────────────────────────────
  // INTEGRATIONS — router: backend/app/routers/integrations.py
  // ───────────────────────────────────────────
  INTEGRATIONS: {
    DRIVE_SYNC:         '/integrations/drive/sync',
  },

  // ───────────────────────────────────────────
  // ADMIN — router: backend/app/routers/admin.py
  // Requires role === "admin" on the backend
  // ───────────────────────────────────────────
  ADMIN: {
    USERS:              '/admin/users',
  },

  // ───────────────────────────────────────────
  // HEALTH — router: backend/app/routers/health.py
  // ───────────────────────────────────────────
  HEALTH: {
    CHECK:              '/health',
  },
} as const;
