import type { Page, Route } from '@playwright/test';

const ORG_ID = 'org-e2e-optimustest';
const USER_ID = 'user-e2e-owner';

const DESK_CODES = [
  'CRM',
  'VENTES',
  'SUPPORT',
  'MARKETING',
  'ERP',
  'COMPTABILITE',
  'RH',
  'JURIDIQUE',
  'STOCK',
  'ANALYTICS',
  'STRATEGIE',
] as const;

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function mockAgents() {
  return DESK_CODES.map((code, i) => ({
    id: `agent-${code.toLowerCase()}`,
    organizationId: ORG_ID,
    createdAt: '2026-01-01T00:00:00Z',
    code,
    name: `Agent ${code}`,
    domain: code,
    description: `Description ${code}`,
    mission: `Mission ${code}`,
    status: i === 1 ? 'WAITING_APPROVAL' : 'AVAILABLE',
    capabilities: 'demo',
  }));
}

function mockActions() {
  return [
    {
      id: 'action-1',
      organizationId: ORG_ID,
      createdAt: '2026-01-01T00:00:00Z',
      agentId: 'agent-ventes',
      requestedBy: USER_ID,
      actionType: 'RECOMMEND',
      title: 'Approuver campagne Q3',
      description: 'Lancer la campagne prospects prioritaires.',
      draftPayload: '{}',
      workflowStatus: 'REQUEST_APPROVAL',
      agentStatus: 'WAITING_APPROVAL',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];
}

/**
 * Intercepts NIHAO API calls so AI Office E2E can run without a live backend.
 * Matches both relative `/api` and absolute `http://localhost:8080/api`.
 */
export async function installAiOfficeApiMocks(page: Page): Promise<void> {
  await page.route(/\/api\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '') || '/';
    const method = req.method().toUpperCase();

    if (method === 'POST' && path === '/auth/login') {
      return json(route, {
        accessToken: 'e2e-access-token',
        refreshToken: 'e2e-refresh-token',
        userId: USER_ID,
        organizationId: ORG_ID,
        mfaRequired: false,
      });
    }

    if (method === 'POST' && path === '/auth/refresh') {
      return json(route, {
        accessToken: 'e2e-access-token-refreshed',
        refreshToken: 'e2e-refresh-token',
        userId: USER_ID,
        organizationId: ORG_ID,
      });
    }

    if (method === 'GET' && path === '/auth/me') {
      return json(route, {
        id: USER_ID,
        email: 'e2e@nihao.test',
        firstName: 'E2E',
        lastName: 'Owner',
        role: 'OWNER',
        organizationId: ORG_ID,
        organizationName: 'Optimus Test',
      });
    }

    if (method === 'GET' && path === '/auth/oauth2/status') {
      return json(route, { enabled: false, providers: [] });
    }

    if (method === 'POST' && path === '/auth/sso/exchange') {
      return json(route, {
        accessToken: 'e2e-access-token',
        refreshToken: 'e2e-refresh-token',
        userId: USER_ID,
        organizationId: ORG_ID,
      });
    }

    if (method === 'GET' && path === '/organizations/current') {
      return json(route, {
        id: ORG_ID,
        name: 'Optimus Test',
        slug: 'optimustest',
        sector: 'Tech',
        onboardingStatus: 'COMPLETED',
        companyName: 'Optimus Test',
        billingPlan: 'FREE',
      });
    }

    if (method === 'GET' && path === '/agents') {
      return json(route, mockAgents());
    }

    if (method === 'GET' && path === '/agents/actions') {
      return json(route, mockActions());
    }

    if (method === 'GET' && path === '/agents/engine') {
      return json(route, { demo: true, label: 'Démo (mock)' });
    }

    if (method === 'GET' && path === '/theme-preferences') {
      return json(route, { mode: 'CYBERPUNK' });
    }

    if (method === 'PUT' && path === '/theme-preferences') {
      return json(route, { mode: 'CYBERPUNK' });
    }

    if (method === 'GET' && path.startsWith('/company-data')) {
      return json(route, []);
    }

    if (method === 'GET' && path === '/billing/plan') {
      return json(route, {
        plan: 'FREE',
        seatsUsed: 1,
        seatsLimit: 3,
        storageNote: 'E2E stub',
      });
    }

    // Approval / defer / modify — accept and return empty OK
    if (
      method === 'POST' &&
      (/\/agents\/actions\/[^/]+\/(approve|reject|defer|modify)/.test(path) ||
        /\/approvals\//.test(path))
    ) {
      return json(route, { ok: true });
    }

    // Default: empty success to avoid blocking shell widgets
    if (method === 'GET') {
      return json(route, Array.isArray([]) ? [] : {});
    }
    return json(route, {});
  });
}

export async function loginAsDemo(page: Page, email = 'e2e@nihao.test', password = 'Demo2026!'): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button.login-btn[type="submit"]').click();
}
