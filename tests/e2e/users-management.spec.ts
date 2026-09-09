import { test, expect } from './fixtures';
import { APIRequestContext } from '@playwright/test';

let createdUserId: string | null = null;

test.describe('Users Management', () => {
  let userApi: APIRequestContext;

  test.beforeAll(async ({ authenticatedApi }) => {
    userApi = authenticatedApi;
  });

  test.afterAll(async () => {
    if (userApi && createdUserId) {
      try {
        await userApi.delete(`/api/v1/users/${createdUserId}`);
      } catch (e) {
        console.warn('Failed to cleanup test user:', e);
      }
      await userApi.dispose();
    }
  });

  test.describe('Create User', () => {
    test('create user with valid data succeeds', async () => {
      const response = await userApi.post('/api/v1/users', {
        data: {
          email: `testuser-${Date.now()}@example.com`,
          password: 'TestPass123',
          firstName: 'Test',
          lastName: 'User',
          role: 'TEACHER',
        },
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.email).toContain('testuser-');
      expect(body.data.role).toBe('TEACHER');
      expect(body.data.id).toBeDefined();

      createdUserId = body.data.id;
    });

    test('create user with invalid email returns 400', async () => {
      const response = await userApi.post('/api/v1/users', {
        data: {
          email: 'not-an-email',
          password: 'TestPass123',
          firstName: 'Test',
          lastName: 'User',
          role: 'TEACHER',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('List Users', () => {
    test('list users returns array of users', async () => {
      const response = await userApi.get('/api/v1/users');

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  test.describe('View User Details', () => {
    test('view user details by publicId succeeds', async () => {
      test.skip(!createdUserId, 'No created user to view');

      const response = await userApi.get(`/api/v1/users/${createdUserId}`);

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdUserId);
    });
  });

  test.describe('Update User', () => {
    test('update user details succeeds', async () => {
      test.skip(!createdUserId, 'No created user to update');

      const newFirstName = `Updated-${Date.now()}`;
      const response = await userApi.patch(`/api/v1/users/${createdUserId}`, {
        data: {
          firstName: newFirstName,
          phone: '+1234567890',
        },
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.firstName).toBe(newFirstName);
      expect(body.data.phone).toBe('+1234567890');
    });
  });

  test.describe('Change User Role', () => {
    test('change user role with confirmation succeeds', async () => {
      test.skip(!createdUserId, 'No created user to update role');

      const response = await userApi.patch(`/api/v1/users/${createdUserId}/role`, {
        data: {
          role: 'STUDENT',
          confirmation: 'yes',
        },
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('STUDENT');
    });

    test('change user role without confirmation returns 400', async () => {
      test.skip(!createdUserId, 'No created user to update role');

      const response = await userApi.patch(`/api/v1/users/${createdUserId}/role`, {
        data: {
          role: 'TEACHER',
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});
