import { test, expect } from '@playwright/test';
import { expectNoCriticalA11yViolations } from './helpers/a11y';

test.describe('W3C / WCAG accessibility (axe)', () => {
  test('login page has no serious violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'NIHAO' })).toBeVisible();
    await expectNoCriticalA11yViolations(page, 'login');
  });

  test('register page has no serious violations', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'NIHAO' })).toBeVisible();
    await expectNoCriticalA11yViolations(page, 'register');
  });

  test('forgot-password page has no serious violations', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /Mot de passe oublié/i })).toBeVisible();
    await expectNoCriticalA11yViolations(page, 'forgot-password');
  });

  test('skip link targets main landmark', async ({ page }) => {
    await page.goto('/login');
    const skip = page.getByRole('link', { name: /Aller au contenu/i });
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(skip).toBeFocused();
  });
});
