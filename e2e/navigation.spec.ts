import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads and shows key elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toContain('AfriBiz');
  });

  test('marketplace page is accessible', async ({ page }) => {
    await page.goto('/marketplace', { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    const hasContent = bodyText.includes('marketplace') || bodyText.includes('produit') || bodyText.includes('service');
    expect(hasContent).toBeTruthy();
  });

  test('login page is directly accessible', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 10000 });
  });
});
