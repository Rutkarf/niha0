import { test, expect } from '@playwright/test';

test.describe('Marketing surfaces', () => {
  test('landing shows brand and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'NIHAO' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /Not For Human Conception/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Créer mon espace|Create workspace/i }).first()).toBeVisible();
    await expect(page.locator('footer.foot a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('footer.foot a[href="/cgu"]')).toBeVisible();
  });

  test('sign-in exposes audience profiles', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Se connecter|Sign in|Connexion|Login/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Créer un espace/i })).toBeVisible();
    await page.locator('#profile-trigger').click();
    const options = page.getByRole('option');
    await expect(options).toHaveCount(6);
    await expect(options.nth(0)).toContainText('Association');
    await expect(options.nth(5)).toContainText('Professionnel');
    await page.getByRole('option', { name: /Partenaire/i }).click();
    await expect(page.getByRole('heading', { level: 4, name: /Partner/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer mon espace Partenaire/i })).toBeVisible();
    await expect(page.getByText(/Modules utiles · Partenaire/i)).toBeVisible();
    await expect(page.locator('.offer-plan')).toHaveCount(3);
  });

  test('sign-in offer cards stay aligned across roles', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#profile-trigger').click();
    await page.getByRole('option', { name: /Entreprise/i }).click();
    await expect(page.locator('.offer-plan')).toHaveCount(3);
    await expect(page.locator('.offer-highlights li')).toHaveCount(18);

    await page.locator('#profile-trigger').click();
    await page.getByRole('option', { name: /Particulier/i }).click();
    await expect(page.locator('.offer-plan')).toHaveCount(3);
    await expect(page.locator('.offer-highlights li')).toHaveCount(18);
    await expect(page.locator('.offer-tile')).toHaveCount(4);
  });

  test('pricing adapts to audience role', async ({ page }) => {
    await page.goto('/pricing?role=entreprise');
    await expect(page.getByRole('heading', { name: /FREE/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^PRO$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /BUSINESS/i })).toBeVisible();

    await page.getByRole('tab', { name: 'Particulier' }).click();
    await expect(page.getByRole('heading', { name: /Essentiel/i })).toBeVisible();
  });
});
