import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `test-e2e-${Date.now()}@example.com`,
  password: 'Test@123456',
  fullName: 'Test User',
};

test.describe('Authentication', () => {
  test('register a new account', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Créez votre compte');

    await page.getByLabel('Nom complet').fill(TEST_USER.fullName);
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill(TEST_USER.password);
    await page.getByLabel('Confirmer le mot de passe').fill(TEST_USER.password);
    await page.getByLabel(/conditions/).check();
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    await expect(page).toHaveURL(/dashboard|\/verify-email/, { timeout: 20000 });
  });

  test('login with registered account', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

    await page.locator('input[name="identifier"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  });

  test('show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText(/requis|obligatoire|invalide/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('login form has password field', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
  });
});
