import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('login with valid credentials returns tokens and user', async ({ api }) => {
      const email = process.env.TEST_ADMIN_EMAIL || 'superadmin@schoolms.com';
      const password = process.env.TEST_ADMIN_PASSWORD || 'password123';

      const response = await api.post('/api/v1/auth/login', {
        data: { email, password },
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user).toBeDefined();
      expect(body.data.user.email).toBe(email);
      expect(body.data.user.role).toBe('SUPER_ADMIN');
    });

    test('login with invalid credentials returns 401', async ({ api }) => {
      const response = await api.post('/api/v1/auth/login', {
        data: { email: 'wrong@example.com', password: 'wrongpassword' },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('login with missing password returns 400', async ({ api }) => {
      const response = await api.post('/api/v1/auth/login', {
        data: { email: 'superadmin@schoolms.com' },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Protected Route Access', () => {
    test('accessing protected route without token returns 401', async ({ api }) => {
      const response = await api.get('/api/v1/users/me');
      expect(response.status()).toBe(401);
    });

    test('accessing protected route with valid token succeeds', async ({ authenticatedApi }) => {
      const response = await authenticatedApi.get('/api/v1/users/me');

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    });
  });

  test.describe('Token Refresh', () => {
    test('refresh token returns new access and refresh tokens', async ({ api, refreshToken }) => {
      const response = await api.post('/api/v1/auth/refresh', {
        data: { refreshToken },
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    test('refresh with invalid token returns 401', async ({ api }) => {
      const response = await api.post('/api/v1/auth/refresh', {
        data: { refreshToken: 'invalid-token' },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Logout', () => {
    test('logout invalidates refresh token', async ({ api, refreshToken }) => {
      const response = await api.post('/api/v1/auth/logout', {
        data: { refreshToken },
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('Logged out successfully');
    });
  });
});
