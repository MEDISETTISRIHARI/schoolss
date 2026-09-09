import { test as base, expect } from '@playwright/test';
import { APIRequestContext } from '@playwright/test';

export type AuthFixtures = {
  api: APIRequestContext;
  authenticatedApi: APIRequestContext;
  authToken: string;
  refreshToken: string;
  superAdminUser: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
};

export const test = base.extend<AuthFixtures>({
  api: async ({}, use) => {
    const api = (base as any).context.request.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
    await use(api);
    await api.dispose();
  },

  authenticatedApi: async ({ api }, use) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'superadmin@schoolms.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'password123';

    const response = await api.post('/api/v1/auth/login', {
      data: { email, password },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.accessToken).toBeDefined();

    const authApi = (base as any).context.request.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.data.accessToken}`,
      },
    });

    await use(authApi);
    await authApi.dispose();
  },

  authToken: async ({ api }, use) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'superadmin@schoolms.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'password123';

    const response = await api.post('/api/v1/auth/login', {
      data: { email, password },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.accessToken).toBeDefined();

    await use(body.data.accessToken);
  },

  refreshToken: async ({ api }, use) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'superadmin@schoolms.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'password123';

    const response = await api.post('/api/v1/auth/login', {
      data: { email, password },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.refreshToken).toBeDefined();

    await use(body.data.refreshToken);
  },

  superAdminUser: async ({ api }, use) => {
    const email = process.env.TEST_ADMIN_EMAIL || 'superadmin@schoolms.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'password123';

    const response = await api.post('/api/v1/auth/login', {
      data: { email, password },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    await use({
      id: body.data.user.id,
      email: body.data.user.email,
      role: body.data.user.role,
      firstName: body.data.user.firstName,
      lastName: body.data.user.lastName,
    });
  },
});

export { expect } from '@playwright/test';
