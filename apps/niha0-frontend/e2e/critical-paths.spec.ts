import { test, expect } from '@playwright/test';

test.describe('Critical path smokes', () => {
  test('login page is reachable and accessible', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'NIHAO' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: /Connexion|Sign in|Se connecter/i })).toBeVisible();
  });

  test('register page shows professional form', async ({ page }) => {
    const res = await page.goto('/register');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'NIHAO' })).toBeVisible();
    await expect(page.getByLabel(/Nom de l’entreprise/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer mon espace/i })).toBeVisible();
  });

  test('forgot-password page is reachable', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /Mot de passe oublié/i })).toBeVisible();
  });
});
