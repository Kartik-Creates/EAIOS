/**
 * admin.types.ts
 *
 * TypeScript contracts for the Admin panel.
 *
 * The admin backend router returns UserRead objects — the same schema
 * as /auth/me. We re-export a semantically clear alias so the intent
 * is explicit in admin-facing components.
 *
 * Backend source: backend/app/schemas/user.py → UserRead
 * Endpoint: GET /api/v1/admin/users → UserRead[]
 * Access: requires role === "admin" (backend enforces via require_role)
 */

import type { User } from './auth.types';

// ─────────────────────────────────────────────
// AdminUser
// Semantic alias for UserRead in the admin context.
// Keeps admin components explicit about their data domain.
// ─────────────────────────────────────────────
export type AdminUser = User;

// ─────────────────────────────────────────────
// Admin Hook State (frontend-only)
// Defines the shape returned by useAdmin() (future hook)
// ─────────────────────────────────────────────
export interface AdminState {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
}
