import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `test-e2e-${Date.now()}@example.com`,
  password: 'Test@123456',
  fullName: 'Test User',
};

test.describe('Authentication', () => {
  test('register a new account', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Créer un compte');

    await page.getByPlaceholder('Koffi Kouassi').fill(TEST_USER.fullName);
    await page.getByPlaceholder('exemple@email.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Créez un mot de passe sécurisé').fill(TEST_USER.password);
    await page.getByPlaceholder('Répétez le mot de passe').fill(TEST_USER.password);
    
    await page.getByPlaceholder('90 00 00 00').fill('90000000');
    
    // Location fields are handled by LocationSelect. 
    // Since they are required by Zod (signupSchema), we must fill them.
    // Let's target the select/input elements in LocationSelect.
    // Assuming Togo is the default or first option.
    await page.locator('select').first().selectOption({ label: 'Togo' }); // Country
    await page.locator('select').nth(1).selectOption({ index: 0 }); // Region
    await page.locator('select').nth(2).selectOption({ index: 0 }); // City
    
    await page.getByLabel(/conditions/i).check();
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
