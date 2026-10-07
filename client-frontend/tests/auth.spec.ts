import { expect, test, type Page } from '@playwright/test';

const signupDetails = {
  username: 'playwright_user',
  email: 'playwright@example.com',
  phoneNumber: '5551234567',
  password: 'SecretPass123!',
};

async function fillSignupForm(page: Page) {
  await page.getByLabel('Username').fill(signupDetails.username);
  await page.getByLabel('Email').fill(signupDetails.email);
  await page.getByLabel('Phone Number').fill(signupDetails.phoneNumber);
  await page.getByLabel('Password', { exact: true }).fill(signupDetails.password);
}

test.describe('authentication flows', () => {
  test('signup shows a validation error when passwords do not match', async ({ page }) => {
    await page.goto('/signup');

    await fillSignupForm(page);
    await page.getByLabel('Confirm Password').fill('DifferentPass123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByRole('alert')).toHaveText('Password confirmation does not match.');
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('signup submits the expected payload and returns to sign in', async ({ page }) => {
    await page.route('**/api/auth/signup', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Registration successful.' }),
      });
    });

    await page.goto('/signup');

    await fillSignupForm(page);
    await page.getByLabel('Confirm Password').fill(signupDetails.password);

    const requestPromise = page.waitForRequest('**/api/auth/signup');
    await page.getByRole('button', { name: 'Create Account' }).click();

    const signupRequest = await requestPromise;
    expect(signupRequest.postDataJSON()).toEqual(signupDetails);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('login requires both username and password', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('playwright_user');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toHaveText('Please enter username and password.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login stores the auth token and opens the dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'playwright-auth-token' }),
      });
    });

    await page.goto('/login');

    await page.getByLabel('Username').fill('playwright_user');
    await page.getByLabel('Password', { exact: true }).fill('SecretPass123!');

    const requestPromise = page.waitForRequest('**/api/auth/login');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const loginRequest = await requestPromise;
    expect(loginRequest.postDataJSON()).toEqual({
      username: 'playwright_user',
      password: 'SecretPass123!',
    });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem('tidbits_auth_token')))
      .toBe('playwright-auth-token');
  });

});
