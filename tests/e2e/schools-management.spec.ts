import { test, expect } from './fixtures';
import { APIRequestContext } from '@playwright/test';

let createdSchoolId: string | null = null;

test.describe('Schools Management', () => {
  let schoolApi: APIRequestContext;

  test.beforeAll(async ({ authenticatedApi }) => {
    schoolApi = authenticatedApi;
  });

  test.afterAll(async () => {
    if (schoolApi && createdSchoolId) {
      try {
        await schoolApi.patch(`/api/v1/schools/${createdSchoolId}/deactivate`, {
          data: { confirmation: 'yes' },
        });
      } catch (e) {
        console.warn('Failed to deactivate test school:', e);
      }
      await schoolApi.dispose();
    }
  });

  test.describe('Create School', () => {
    test('create school with valid data succeeds', async () => {
      const response = await schoolApi.post('/api/v1/schools', {
        data: {
          name: `Test School ${Date.now()}`,
          subdomain: `test-school-${Date.now()}`,
          address: '456 Education Ave',
          phone: '+1987654321',
          email: 'test-school@example.com',
          isActive: true,
        },
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.name).toContain('Test School');
      expect(body.data.id).toBeDefined();

      createdSchoolId = body.data.id;
    });

    test('create school with missing name returns 400', async () => {
      const response = await schoolApi.post('/api/v1/schools', {
        data: {
          subdomain: `test-school-no-name-${Date.now()}`,
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('List Schools', () => {
    test('list schools returns array of schools', async () => {
      const response = await schoolApi.get('/api/v1/schools');

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  test.describe('Update School', () => {
    test('update school details succeeds', async () => {
      test.skip(!createdSchoolId, 'No created school to update');

      const newName = `Updated School ${Date.now()}`;
      const response = await schoolApi.patch(`/api/v1/schools/${createdSchoolId}`, {
        data: {
          name: newName,
          phone: '+15551234567',
        },
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(newName);
      expect(body.data.phone).toBe('+15551234567');
    });
  });

  test.describe('Deactivate School', () => {
    test('deactivate school with confirmation succeeds', async () => {
      test.skip(!createdSchoolId, 'No created school to deactivate');

      const response = await schoolApi.patch(`/api/v1/schools/${createdSchoolId}/deactivate`, {
        data: {
          confirmation: 'yes',
        },
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('deactivate school without confirmation returns 400', async () => {
      test.skip(!createdSchoolId, 'No created school to deactivate');

      const response = await schoolApi.patch(`/api/v1/schools/${createdSchoolId}/deactivate`, {
        data: {},
      });

      expect(response.status()).toBe(400);
    });
  });
});
