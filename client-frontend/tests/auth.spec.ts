import { expect, test, type Page } from '@playwright/test';

const signupDetails = {
  username: 'playwright_user',
  email: 'playwright@example.com',
  phoneNumber: '5551234567',
  dateOfBirth: '2020-06-14',
  password: 'SecretPass123!',
};

const dashboardSessionToken = 'playwright-auth-token';

type TradingAccountFixture = {
  account_id: number;
  user_id: number;
  nickname: string;
  cash_balance: number;
  created_at: string;
};

function formatDateForInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fillSignupForm(page: Page) {
  await page.getByLabel('Username').fill(signupDetails.username);
  await page.getByLabel('Email').fill(signupDetails.email);
  await page.getByLabel('Date of Birth').fill(signupDetails.dateOfBirth);
  await page.getByLabel('Phone Number').fill(signupDetails.phoneNumber);
  await page.getByLabel('Password', { exact: true }).fill(signupDetails.password);
}

async function openAuthenticatedDashboard(page: Page) {
  await page.addInitScript(token => {
    window.localStorage.setItem('tidbits_auth_token', token);
  }, dashboardSessionToken);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
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

  test('signup does not submit when email or phone number is invalid', async ({ page }) => {
    let signupRequests = 0;
    page.on('request', request => {
      if (request.url().includes('/api/auth/signup')) {
        signupRequests += 1;
      }
    });

    await page.goto('/signup');

    await page.getByLabel('Username').fill(signupDetails.username);
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Date of Birth').fill(signupDetails.dateOfBirth);
    await page.getByLabel('Phone Number').fill('12345');
    await page.getByLabel('Password', { exact: true }).fill(signupDetails.password);
    await page.getByLabel('Confirm Password').fill(signupDetails.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.');
    await expect(page.locator('.field-error').filter({ hasText: 'Enter a valid email address.' })).toBeVisible();
    await expect(page.locator('.field-error').filter({ hasText: 'Enter a valid 10-digit US phone number.' })).toBeVisible();
    await page.waitForTimeout(150);
    expect(signupRequests).toBe(0);
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('signup does not submit when date of birth is in the future', async ({ page }) => {
    let signupRequests = 0;
    page.on('request', request => {
      if (request.url().includes('/api/auth/signup')) {
        signupRequests += 1;
      }
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await page.goto('/signup');

    await page.getByLabel('Username').fill(signupDetails.username);
    await page.getByLabel('Email').fill(signupDetails.email);
    await page.getByLabel('Date of Birth').fill(formatDateForInput(tomorrow));
    await page.getByLabel('Phone Number').fill(signupDetails.phoneNumber);
    await page.getByLabel('Password', { exact: true }).fill(signupDetails.password);
    await page.getByLabel('Confirm Password').fill(signupDetails.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByRole('alert')).toHaveText('Enter a valid date of birth.');
    await expect(page.locator('.field-error').filter({ hasText: 'Enter a valid date of birth.' })).toBeVisible();
    await page.waitForTimeout(150);
    expect(signupRequests).toBe(0);
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

  test('login shows an invalid credentials error when the server rejects the login', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          errorCode: 'INVALID_LOGIN',
          message: 'invalid username or password',
          status: 401,
          path: '/api/auth/login',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/login');

    await page.getByLabel('Username').fill('playwright_user');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') && response.status() === 401
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await responsePromise;

    await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();
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

test.describe('account management flows', () => {
  test('dashboard shows holdings for the selected account', async ({ page }) => {
    await openAuthenticatedDashboard(page);

    const holdingsTable = page.getByRole('table', { name: 'Portfolio holdings' });
    await expect(page.getByText('Your Holdings', { exact: true })).toBeVisible();
    await expect(holdingsTable).toBeVisible();
    await expect(holdingsTable.locator('tbody tr')).toHaveCount(3);
    await expect(holdingsTable).toContainText('AAPL');
    await expect(holdingsTable).toContainText('MSFT');
    await expect(holdingsTable).toContainText('BTCUSD');

    await page.getByRole('combobox', { name: 'Select account' }).selectOption('102');

    await expect(holdingsTable.locator('tbody tr')).toHaveCount(2);
    await expect(holdingsTable).toContainText('RELIANCE');
    await expect(holdingsTable).toContainText('ETHUSD');
    await expect(holdingsTable).not.toContainText('AAPL');
  });

  test.fixme('deposit money submits the selected account amount to the deposit endpoint', async ({ page }) => {
    await page.route('**/api/accounts/101/deposit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 101,
          transactionType: 'deposit',
          amount: 1000,
          balanceAfter: 16420.55,
        }),
      });
    });

    await openAuthenticatedDashboard(page);

    const depositRequest = page.waitForRequest('**/api/accounts/101/deposit');
    await page.getByRole('button', { name: /deposit money/i }).click();
    await page.getByLabel(/amount/i).fill('1000');
    await page.getByRole('button', { name: /confirm deposit/i }).click();

    await expect((await depositRequest).postData()).toBe('1000');
    await expect(page.getByText(/\$16,420\.55/)).toBeVisible();
  });

  test.fixme('withdraw money submits the selected account amount to the withdrawal endpoint', async ({ page }) => {
    await page.route('**/api/accounts/101/withdraw', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 101,
          transactionType: 'withdraw',
          amount: 250,
          balanceAfter: 15170.55,
        }),
      });
    });

    await openAuthenticatedDashboard(page);

    const withdrawRequest = page.waitForRequest('**/api/accounts/101/withdraw');
    await page.getByRole('button', { name: /withdraw money/i }).click();
    await page.getByLabel(/amount/i).fill('250');
    await page.getByRole('button', { name: /confirm withdrawal/i }).click();

    await expect((await withdrawRequest).postData()).toBe('250');
    await expect(page.getByText(/\$15,170\.55/)).toBeVisible();
  });

  test.fixme('create account posts the new nickname and adds it to the account selector', async ({ page }) => {
    await page.route('**/api/users/13/accounts', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          account_id: 103,
          user_id: 13,
          nickname: 'Income Sleeve',
          cash_balance: 0,
          created_at: '2026-10-12T09:00:00Z',
        }),
      });
    });

    await openAuthenticatedDashboard(page);

    const createRequest = page.waitForRequest('**/api/users/13/accounts');
    await page.getByRole('button', { name: /create account/i }).click();
    await page.getByLabel(/account nickname/i).fill('Income Sleeve');
    await page.getByRole('button', { name: /save account/i }).click();

    await expect((await createRequest).postData()).toBe('Income Sleeve');
    await expect(page.getByRole('combobox', { name: 'Select account' })).toContainText('Income Sleeve');
  });

  test.fixme('update account renames the selected account through the account endpoint', async ({ page }) => {
    await page.route('**/api/users/13/accounts/101', async route => {
      await route.fulfill({ status: 202, body: '' });
    });

    await openAuthenticatedDashboard(page);

    const updateRequest = page.waitForRequest('**/api/users/13/accounts/101');
    await page.getByRole('button', { name: /edit account/i }).click();
    await page.getByLabel(/account nickname/i).fill('Core Growth');
    await page.getByRole('button', { name: /update account/i }).click();

    await expect((await updateRequest).postData()).toBe('Core Growth');
    await expect(page.getByRole('combobox', { name: 'Select account' })).toContainText('Core Growth');
  });

  test.fixme('delete account removes the selected account after confirmation', async ({ page }) => {
    await page.route('**/api/users/13/accounts/102', async route => {
      await route.fulfill({ status: 204, body: '' });
    });

    await openAuthenticatedDashboard(page);
    await page.getByRole('combobox', { name: 'Select account' }).selectOption('102');

    const deleteRequest = page.waitForRequest('**/api/users/13/accounts/102');
    await page.getByRole('button', { name: /delete account/i }).click();
    await page.getByRole('button', { name: /confirm delete/i }).click();

    expect((await deleteRequest).method()).toBe('DELETE');
    await expect(page.getByRole('combobox', { name: 'Select account' })).not.toContainText('Global Macro');
  });
});

