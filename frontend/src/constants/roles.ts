/**
 * roles.ts
 *
 * RBAC role constants and display configuration.
 *
 * Mirrors: backend/app/models/user.py → User.role column
 * Possible values: "employee" | "manager" | "hr" | "admin"
 *
 * RULE: Never use raw role strings ("admin", "employee", etc.) anywhere
 *       in components or logic. Always import from this file.
 */

import type { Role } from '@/types/auth.types';

// ─────────────────────────────────────────────
// Role Constants
// ─────────────────────────────────────────────
export const ROLES = {
  EMPLOYEE: 'employee' as Role,
  MANAGER:  'manager'  as Role,
  HR:       'hr'       as Role,
  ADMIN:    'admin'    as Role,
} as const;

// ─────────────────────────────────────────────
// Role Display Metadata
// Used by Badge component and Admin table to render role pills
// ─────────────────────────────────────────────
export interface RoleMeta {
  label: string;
  color: string;  // CSS custom property value or hex
  bg: string;     // background color for badge
}

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    label: 'Admin',
    color: '#a78bfa',               // purple-400
    bg:    'rgba(167, 139, 250, 0.15)',
  },
  manager: {
    label: 'Manager',
    color: '#60a5fa',               // blue-400
    bg:    'rgba(96, 165, 250, 0.15)',
  },
  hr: {
    label: 'HR',
    color: '#34d399',               // emerald-400
    bg:    'rgba(52, 211, 153, 0.15)',
  },
  employee: {
    label: 'Employee',
    color: '#94a3b8',               // slate-400 (--text-muted)
    bg:    'rgba(148, 163, 184, 0.15)',
  },
};

// ─────────────────────────────────────────────
// Role Hierarchy (higher index = more permissions)
// Used for permission checks in AdminRoute and future guards
// ─────────────────────────────────────────────
export const ROLE_HIERARCHY: Role[] = [
  ROLES.EMPLOYEE,
  ROLES.HR,
  ROLES.MANAGER,
  ROLES.ADMIN,
];

/**
 * Check if a given role meets the minimum required role level.
 *
 * @example
 * hasMinimumRole('admin', 'manager') // true  — admin > manager
 * hasMinimumRole('employee', 'hr')   // false — employee < hr
 */
export const hasMinimumRole = (userRole: Role, requiredRole: Role): boolean => {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
};
