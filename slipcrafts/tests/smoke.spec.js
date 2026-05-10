import { expect, test } from '@playwright/test';

test('home page renders the primary Transferly launch surface', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Transferly/i);
  await expect(
    page.getByRole('heading', { name: 'The All-in-One Digital Services Platform' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get Started Free' })).toBeVisible();
  await expect(page.getByText('Supported Platforms')).toBeVisible();
});
