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
  PERSONALIZATION: '/personalization',
  SETTINGS:     '/settings',

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
  /** Key for i18n translation */
  translationKey?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label:     'Dashboard',
    path:      ROUTES.DASHBOARD,
    icon:      'LayoutDashboard',
    adminOnly: false,
    translationKey: 'navigation.dashboard',
  },
  {
    label:     'Chat',
    path:      ROUTES.CHAT,
    icon:      'MessageSquare',
    adminOnly: false,
    translationKey: 'navigation.chat',
  },
  {
    label:     'Search',
    path:      ROUTES.SEARCH,
    icon:      'Search',
    adminOnly: false,
    translationKey: 'navigation.search',
  },
  {
    label:     'Integrations',
    path:      ROUTES.INTEGRATIONS,
    icon:      'Plug',
    adminOnly: false,
    translationKey: 'navigation.integrations',
  },
  {
    label:     'Profile',
    path:      ROUTES.PROFILE,
    icon:      'User',
    adminOnly: false,
    translationKey: 'navigation.profile',
  },
  {
    label:     'Meeting',
    path:      ROUTES.MEETING,
    icon:      'Mic',
    adminOnly: false,
    translationKey: 'navigation.meeting',
  },
  {
    label:     'Workflow',
    path:      ROUTES.WORKFLOW,
    icon:      'Wand2',
    adminOnly: false,
    translationKey: 'navigation.workflow',
  },
  {
    label:     'Documents',
    path:      ROUTES.DOCUMENTS,
    icon:      'FileText',
    adminOnly: true,
    translationKey: 'navigation.documents',
  },
  {
    label:     'Admin',
    path:      ROUTES.ADMIN,
    icon:      'ShieldCheck',
    adminOnly: true,
    translationKey: 'navigation.admin',
  },
  {
    label:     'Terms & Conditions',
    path:      ROUTES.TERMS,
    adminOnly: false,
    hideInNav: true,
    translationKey: 'navigation.terms',
  },
  {
    label:     'Privacy Policy',
    path:      ROUTES.PRIVACY,
    adminOnly: false,
    hideInNav: true,
    translationKey: 'navigation.privacy',
  },
  {
    label:     'Personalization',
    path:      ROUTES.PERSONALIZATION,
    adminOnly: false,
    hideInNav: true,
    translationKey: 'navigation.personalization',
  },
  {
    label:     'Settings',
    path:      ROUTES.SETTINGS,
    adminOnly: false,
    hideInNav: true,
    translationKey: 'navigation.settings',
  },
];
