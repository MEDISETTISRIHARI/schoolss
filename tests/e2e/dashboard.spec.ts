import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test.describe('Authenticated Access', () => {
    test('dashboard loads for authenticated super admin', async ({ authenticatedApi }) => {
      const response = await authenticatedApi.get('/api/v1/users/me');

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.email).toBe(process.env.TEST_ADMIN_EMAIL || 'superadmin@schoolms.com');
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('unauthenticated request to protected endpoint returns 401', async ({ api }) => {
      const response = await api.get('/api/v1/users/me');
      expect(response.status()).toBe(401);
    });

    test('unauthenticated request to dashboard endpoint returns 401', async ({ api }) => {
      const response = await api.get('/api/v1/schools');
      expect(response.status()).toBe(401);
    });
  });
});
