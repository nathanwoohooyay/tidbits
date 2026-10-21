import { expect, test, type Page, type Route } from '@playwright/test';

const signupDetails = {
  username: `pw_user_${Date.now()}`,
  email: `pw_user_${Date.now()}@example.com`,
  phoneNumber: '5551234567',
  dateOfBirth: '1990-06-14',
  password: 'SecretPass123!',
};

const user = {
  userId: 13,
  username: signupDetails.username,
  email: signupDetails.email,
  phoneNumber: signupDetails.phoneNumber,
  role_id: 2,
  reward_points: 0,
};

const account = {
  accountId: 101,
  userId: 13,
  nickname: 'Main Account',
  cashBalance:0,
};

const createdAccount = {
  accountId: 102,
  userId: 13,
  nickname: 'pTest',
  cashBalance: 0,
};

async function fillSignupForm(page: Page, overrides: Partial<typeof signupDetails> = {}) {
  const values = { ...signupDetails, ...overrides };
  await page.getByLabel('Username').fill(values.username);
  await page.getByLabel('Email').fill(values.email);
  await page.getByLabel('Date of Birth').fill(values.dateOfBirth);
  await page.getByLabel('Phone Number').fill(values.phoneNumber);
  await page.getByLabel('Password', { exact: true }).fill(values.password);
  await page.getByLabel('Confirm Password').fill(values.password);
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function configureApplicationRoutes(page: Page) {
  let accountsFixture = [account];

  await page.route('**/api/auth/signup', route => fulfillJson(route, { message: 'Registration successful.' }, 201));
  await page.route('**/api/auth/login', route => fulfillJson(route, {
    token: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMyJ9.playwright-signature',
  }));
  await page.route('**/api/users/13', route => fulfillJson(route, user));
  await page.route('**/api/accounts/*/orders', route => fulfillJson(route, []));
  await page.route('**/api/accounts/*/holdings', route => fulfillJson(route, []));
  await page.route('**/api/pricing/quotes**', route => fulfillJson(route, {
    asOf: new Date().toISOString(),
    quotes: [
      {
        instrumentId: 1,
        symbol: 'AAPL',
        price: 200,
        change: -4,
        bid: 199.9,
        ask: 200.1,
        changePercent: -2,
        prevClose: 204,
        currency: 'USD',
        asOf: new Date().toISOString(),
        stale: false,
        source: 'playwright',
      },
      {
        instrumentId: 2,
        symbol: 'MSFT',
        price: 400,
        change: 8,
        bid: 399.9,
        ask: 400.1,
        changePercent: 2,
        prevClose: 392,
        currency: 'USD',
        asOf: new Date().toISOString(),
        stale: false,
        source: 'playwright',
      },
    ],
  }));

  await page.route('**/api/users/13/accounts', async route => {
    if (route.request().method() === 'POST') {
      accountsFixture = [account, createdAccount];
      await fulfillJson(route, createdAccount, 201);
      return;
    }

    await fulfillJson(route, accountsFixture);
  });

  await page.route('**/api/users/13/accounts/102', async route => {
    if (route.request().method() === 'PUT') {
      createdAccount.nickname = 'pwTest';
      await route.fulfill({ status: 202, body: '' });
      return;
    }

    await fulfillJson(route, createdAccount);
  });

  await page.route('**/api/accounts/102/deposit', route => fulfillJson(route, {
    accountId: 102,
    transactionType: 'deposit',
    amount: 50000,
  }));
  await page.route('**/api/accounts/102/withdraw', route => fulfillJson(route, {
    accountId: 102,
    transactionType: 'withdraw',
    amount: 10,
  }));
}

test.describe('registration and trading account lifecycle', () => {
  test('rejects incorrect signup fields without submitting', async ({ page }) => {
    const invalidCases = [
      {
        field: 'Username',
        value: 'x',
        message: 'Username must be 3-30 characters and use only letters, numbers, periods, underscores, or hyphens.',
      },
      { field: 'Email', value: 'invalid-email', message: 'Enter a valid email address.' },
      { field: 'Date of Birth', value: '2099-01-01', message: 'Enter a valid date of birth.' },
      { field: 'Phone Number', value: '12345', message: 'Enter a valid 10-digit US phone number.' },
      {
        field: 'Password',
        value: 'weak',
        message: 'Password must be 8-20 characters and include uppercase, lowercase, and a number.',
      },
      { field: 'Confirm Password', value: 'DifferentPass123!', message: 'Password confirmation does not match.' },
    ];

    for (const invalidCase of invalidCases) {
      let signupRequests = 0;
      page.on('request', request => {
        if (request.url().includes('/api/auth/signup')) {
          signupRequests += 1;
        }
      });

      await page.goto('/signup');
      await fillSignupForm(page, invalidCase.field === 'Password' ? { password: invalidCase.value } : undefined);
      await page.getByLabel(invalidCase.field, { exact: true }).fill(invalidCase.value);
      await page.getByRole('button', { name: 'Create Account' }).click();

      await expect(page.getByRole('alert')).toHaveText(invalidCase.message);
      await expect(page.locator('.field-error').filter({ hasText: invalidCase.message })).toBeVisible();
      expect(signupRequests).toBe(0);
    }
  });

  test('signs up, logs in, manages cash, renames account, filters market, and logs out', async ({ page }) => {
    await configureApplicationRoutes(page);

    await page.goto('/signup');
    await fillSignupForm(page);
    const signupRequestPromise = page.waitForRequest('**/api/auth/signup');
    await page.getByRole('button', { name: 'Create Account' }).click();
    expect((await signupRequestPromise).postDataJSON()).toEqual(signupDetails);
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Username').fill(signupDetails.username);
    await page.getByLabel('Password', { exact: true }).fill(signupDetails.password);
    const loginRequestPromise = page.waitForRequest('**/api/auth/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    expect((await loginRequestPromise).postDataJSON()).toEqual({
      username: signupDetails.username,
      password: signupDetails.password,
    });
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('button', { name: 'Trading account management' }).click();
    await expect(page).toHaveURL(/\/account-management$/);
    await page.getByLabel('Account Nickname').fill('pTest');
    const createRequestPromise = page.waitForRequest('**/api/users/13/accounts');
    await page.getByRole('button', { name: 'Create Account' }).click();
    expect((await createRequestPromise).postDataJSON()).toEqual({ nickname: 'pTest' });
    await expect(page.getByText('Trading account created successfully.')).toBeVisible();
    await expect(page.getByText('pTest', { exact: true })).toBeVisible();

    await page.getByLabel('Amount').fill('50000');
    const depositRequestPromise = page.waitForResponse(response =>
      response.url().includes('/api/accounts/102/deposit') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Deposit Funds' }).click();
    expect((await depositRequestPromise).request().postDataJSON()).toBe(50000);
    await expect(page.getByText('Deposit completed successfully.')).toBeVisible();

    await page.getByLabel('Amount').fill('10');
    const withdrawRequestPromise = page.waitForResponse(response =>
      response.url().includes('/api/accounts/102/withdraw') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Withdraw Funds' }).click();
    expect((await withdrawRequestPromise).request().postDataJSON()).toBe(10);
    await expect(page.getByText('Withdrawal completed successfully.')).toBeVisible();

    await page.getByLabel('Nickname').fill('pwTest');
    const renameRequestPromise = page.waitForRequest('**/api/users/13/accounts/102');
    await page.getByRole('button', { name: 'Save Account Name' }).click();
    expect((await renameRequestPromise).postDataJSON()).toEqual({ nickname: 'pwTest' });
    await expect(page.getByText('Trading account updated successfully.')).toBeVisible();

    await page.getByRole('button', { name: /Back to Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const snapshot = page.getByRole('region', { name: 'Market snapshot' });
    await expect(snapshot).toBeVisible();
    await snapshot.getByRole('button', { name: 'Top Losers' }).click();
    await expect(snapshot.getByRole('button', { name: 'Top Losers' })).toHaveClass(/active/);

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});
