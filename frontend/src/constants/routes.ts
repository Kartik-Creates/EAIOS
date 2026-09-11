/**
 * routes.ts
 *
 * Frontend route path constants.
 *
 * Used by:
 *  - src/routes/AppRoutes.tsx      (route definitions)
 *  - src/components/layout/Sidebar.tsx (navigation links)
 *  - src/context/AuthContext.tsx   (redirect after login/logout)
 *  - src/components/auth/ProtectedRoute.tsx
 *  - src/components/auth/AdminRoute.tsx
 *
 * RULE: Never write route path strings directly in components.
 *       Always import from this file.
 */

export const ROUTES = {
  // ── Public routes (no auth required) ──
  ROOT:         '/',
  LOGIN:        '/login',
  REGISTER:     '/register',
  TERMS:        '/terms',
  PRIVACY:      '/privacy',

  // ── Protected routes (auth required) ──
  DASHBOARD:    '/dashboard',
  CHAT:         '/chat',
  SEARCH:       '/search',
  INTEGRATIONS: '/integrations',
  PROFILE:      '/profile',
  MEETING:      '/meeting',
  WORKFLOW:     '/workflow',
  DOCUMENTS:    '/documents',

  // ── Admin route (auth + admin role required) ──
  ADMIN:        '/admin',

  // ── Catch-all ──
  NOT_FOUND:    '*',
} as const;

// ─────────────────────────────────────────────
// Sidebar Navigation Links
// Controls which routes appear in the sidebar nav and their order.
// Pages excluded from nav: LOGIN, REGISTER, NOT_FOUND (public/error)
// Admin is conditionally shown based on user role.
// ─────────────────────────────────────────────
export interface NavItem {
  label:     string;
  path:      string;
  /** Icon name (must exist in the ICON_MAP used by the component rendering the nav).
   * Use this for sidebar nav items. */
  icon?:      string;
  /** When true, the item is only visible/navigable to admin users. */
  adminOnly: boolean;
  /** When true, this item is hidden from the sidebar navigation (e.g. legal pages
   * that are linked from the Profile / Footer dropdown instead of the main nav). */
  hideInNav?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label:     'Dashboard',
    path:      ROUTES.DASHBOARD,
    icon:      'LayoutDashboard',
    adminOnly: false,
  },
  {
    label:     'Chat',
    path:      ROUTES.CHAT,
    icon:      'MessageSquare',
    adminOnly: false,
  },
  {
    label:     'Search',
    path:      ROUTES.SEARCH,
    icon:      'Search',
    adminOnly: false,
  },
  {
    label:     'Integrations',
    path:      ROUTES.INTEGRATIONS,
    icon:      'Plug',
    adminOnly: false,
  },
  {
    label:     'Profile',
    path:      ROUTES.PROFILE,
    icon:      'User',
    adminOnly: false,
  },
  {
    label:     'Meeting',
    path:      ROUTES.MEETING,
    icon:      'Mic',
    adminOnly: false,
  },
  {
    label:     'Workflow',
    path:      ROUTES.WORKFLOW,
    icon:      'Wand2',
    adminOnly: false,
  },
  {
    label:     'Documents',
    path:      ROUTES.DOCUMENTS,
    icon:      'FileText',
    adminOnly: true,
  },
  {
    label:     'Admin',
    path:      ROUTES.ADMIN,
    icon:      'ShieldCheck',
    adminOnly: true,
  },
  {
    label:     'Terms & Conditions',
    path:      ROUTES.TERMS,
    adminOnly: false,
    hideInNav: true,
  },
  {
    label:     'Privacy Policy',
    path:      ROUTES.PRIVACY,
    adminOnly: false,
    hideInNav: true,
  },
];
