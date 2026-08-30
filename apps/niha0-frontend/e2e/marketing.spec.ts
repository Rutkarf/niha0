import { test, expect } from '@playwright/test';

test.describe('Marketing surfaces', () => {
  test('landing shows brand and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'NIHAO' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /Not For Human Conception/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Continuer vers l'inscription/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Créer mon espace|Create workspace/i }).first()).toBeVisible();
    await expect(page.locator('footer.foot a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('footer.foot a[href="/cgu"]')).toBeVisible();
  });

  test('sign-in exposes audience profiles', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /Continuer vers l'inscription/i })).toBeVisible();
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
    await expect(page.getByRole('heading', { level: 3, name: /Modules utiles pour Partenaire/i })).toBeVisible();
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

  test('login adapts to audience role query', async ({ page }) => {
    await page.goto('/login?role=entreprise');
    await expect(page.getByRole('heading', { level: 4, name: /^FREE$/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: /^PRO$/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: /BUSINESS/i })).toBeVisible();

    await page.locator('#profile-trigger').click();
    await page.getByRole('option', { name: /Particulier/i }).click();
    await expect(page.getByRole('heading', { level: 4, name: /Essentiel/i })).toBeVisible();
  });

  test('legacy pricing route redirects to login', async ({ page }) => {
    await page.goto('/pricing?role=entreprise');
    await expect(page).toHaveURL(/\/login\?role=entreprise/);
    await expect(page.getByRole('heading', { name: /^Créer un espace$/i })).toBeVisible();
  });
});
