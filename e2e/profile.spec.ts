import { test, expect } from '@playwright/test';

let authToken = '';
let userEmail = '';

test.describe('Profile', () => {
  test.beforeAll(async ({ request }) => {
    userEmail = `profile-${Date.now()}@example.com`;
    const res = await request.post('http://localhost:3001/api/auth/signup', {
      data: {
        firstName: 'Profile',
        lastName: 'Test',
        email: userEmail,
        password: 'Test@123456',
        confirmPassword: 'Test@123456',
        termsAccepted: true,
      },
    });
    const body = await res.json();
    if (body.success) {
      authToken = body.data.accessToken;
    }
  });

  test('profile page loads', async ({ page, context }) => {
    await context.addCookies([
      { name: 'accessToken', value: authToken, domain: 'localhost', path: '/' },
    ]);
    await page.goto('/dashboard/profile', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard\/profile/, { timeout: 15000 });
  });

  test('security page loads', async ({ page, context }) => {
    await context.addCookies([
      { name: 'accessToken', value: authToken, domain: 'localhost', path: '/' },
    ]);
    await page.goto('/dashboard/security', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard\/security/, { timeout: 15000 });
  });
});
