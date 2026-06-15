import { test, expect } from '@playwright/test';

// NOTE: Ces tests nécessitent une session utilisateur authentifiée.
// Ils sont marqués skip en attendant un helper d'authentification.
// Pattern à suivre : créer un compte via /signup avant chaque test.

test.describe('Social Commerce', () => {
  test.describe('Explore page', () => {
    test.skip('loads explore page with StoryRing', async ({ page }) => {
      await page.goto('/dashboard/explore', { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('Explorer');
      await expect(page.getByText('Stories du moment')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tout' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Produits' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Promotions' })).toBeVisible();
    });

    test('filters feed by type', async ({ page }) => {
      await page.goto('/dashboard/explore', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Produits' }).click();
      await expect(page.getByRole('button', { name: 'Produits' })).toHaveClass(/bg-brand-500/);
      await page.getByRole('button', { name: 'Promotions' }).click();
      await expect(page.getByRole('button', { name: 'Promotions' })).toHaveClass(/bg-brand-500/);
    });
  });

  test.describe('Stories page', () => {
    test('loads stories page with tabs', async ({ page }) => {
      await page.goto('/dashboard/stories', { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('Stories');
      await expect(page.getByRole('button', { name: 'Découvrir' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Mes stories' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible();
    });

    test('shows story creator', async ({ page }) => {
      await page.goto('/dashboard/stories', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Nouvelle story/ }).click();
      await expect(page.getByText('Média')).toBeVisible();
      await expect(page.getByText('Détails')).toBeVisible();
      await expect(page.getByRole('button', { name: /Publier/ })).toBeVisible();
    });

    test('switches to analytics tab', async ({ page }) => {
      await page.goto('/dashboard/stories', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Analytics' }).click();
      await expect(page.getByText('Vues par jour')).toBeVisible();
      await expect(page.getByText('Engagement')).toBeVisible();
    });
  });

  test.describe('Shorts page', () => {
    test('loads shorts page', async ({ page }) => {
      await page.goto('/dashboard/shorts', { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('Shorts');
      await expect(page.getByRole('button', { name: /Feed/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Parcourir/ })).toBeVisible();
    });

    test('switches to browse view', async ({ page }) => {
      await page.goto('/dashboard/shorts', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Parcourir/ }).click();
      await expect(page.getByRole('button', { name: /Parcourir/ })).toHaveClass(/bg-brand-500/);
    });
  });

  test.describe('Lives page', () => {
    test('loads lives page with tabs', async ({ page }) => {
      await page.goto('/dashboard/lives', { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('Lives');
      await expect(page.getByRole('button', { name: /En direct/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Planifiés/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Terminés/ })).toBeVisible();
    });

    test('switches between status tabs', async ({ page }) => {
      await page.goto('/dashboard/lives', { waitUntil: 'networkidle' });
      await expect(page.getByRole('button', { name: /En direct/ })).toHaveClass(/bg-brand-500/);
      await page.getByRole('button', { name: /Planifiés/ }).click();
      await expect(page.getByRole('button', { name: /Planifiés/ })).toHaveClass(/bg-brand-500/);
      await page.getByRole('button', { name: /Terminés/ }).click();
      await expect(page.getByRole('button', { name: /Terminés/ })).toHaveClass(/bg-brand-500/);
    });
  });

  test.describe('Offres page', () => {
    test('loads offers page', async ({ page }) => {
      await page.goto('/dashboard/offers', { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('Offres Flash');
      await expect(page.getByRole('button', { name: /Offres/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Autour de moi/ })).toBeVisible();
    });

    test('shows nearby view with radius selector', async ({ page }) => {
      await page.goto('/dashboard/offers', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Autour de moi/ }).click();
      await expect(page.getByText(/Rayon/)).toBeVisible();
      await expect(page.getByRole('button', { name: '5 km' })).toBeVisible();
    });

    test('radius selector works', async ({ page }) => {
      await page.goto('/dashboard/offers', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Autour de moi/ }).click();
      await page.getByRole('button', { name: '25 km' }).click();
      await expect(page.getByRole('button', { name: '25 km' })).toHaveClass(/bg-brand-500/);
    });
  });

  test.describe('Navigation', () => {
    test('can navigate between all social commerce pages', async ({ page }) => {
      await page.goto('/dashboard/explore');
      await expect(page.locator('h1')).toContainText('Explorer');

      await page.goto('/dashboard/stories');
      await expect(page.locator('h1')).toContainText('Stories');

      await page.goto('/dashboard/shorts');
      await expect(page.locator('h1')).toContainText('Shorts');

      await page.goto('/dashboard/lives');
      await expect(page.locator('h1')).toContainText('Lives');

      await page.goto('/dashboard/offers');
      await expect(page.locator('h1')).toContainText('Offres Flash');
    });
  });
});
