/**
 * auth.types.ts
 *
 * TypeScript contracts that mirror the backend Pydantic schemas in:
 *   backend/app/schemas/user.py
 *   backend/app/schemas/oauth.py
 *
 * RULE: Never modify this to diverge from the backend schema without
 *       a matching backend change approved by the backend team.
 */

// ─────────────────────────────────────────────
// RBAC Roles
// Mirrors: User.role column — "employee" | "manager" | "hr" | "admin"
// ─────────────────────────────────────────────
export type Role = 'employee' | 'manager' | 'hr' | 'admin';

// ─────────────────────────────────────────────
// User
// Mirrors: schemas/user.py → UserRead
// Returned by: GET /api/v1/auth/me, GET /api/v1/admin/users[]
// ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  role: Role;
}

// ─────────────────────────────────────────────
// Registration Payload
// Mirrors: schemas/user.py → UserCreate
// Used by: POST /api/v1/auth/register (JSON body)
// ─────────────────────────────────────────────
export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

// ─────────────────────────────────────────────
// Login Payload
// Mirrors: OAuth2PasswordRequestForm (form-urlencoded)
// Used by: POST /api/v1/auth/login
// NOTE: Backend expects `username` field (not `email`) per OAuth2 spec.
// ─────────────────────────────────────────────
export interface LoginPayload {
  username: string; // maps to email value — OAuth2PasswordRequestForm field name
  password: string;
}

// ─────────────────────────────────────────────
// Token Response
// Mirrors: schemas/user.py → Token
// Returned by: POST /api/v1/auth/login, POST /api/v1/auth/refresh
// ─────────────────────────────────────────────
export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

// ─────────────────────────────────────────────
// Refresh Request
// Mirrors: schemas/user.py → RefreshRequest
// Used by: POST /api/v1/auth/refresh (JSON body)
// ─────────────────────────────────────────────
export interface RefreshRequest {
  refresh_token: string;
}

// ─────────────────────────────────────────────
// Auth Context State Shape (frontend-only)
// Not a backend schema — defines what AuthContext exposes
// ─────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
