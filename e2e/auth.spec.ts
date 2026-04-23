import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Logs in as the given role and waits until the browser has navigated to "/".
 * Credentials are sourced from the values baked into server/.env.test (and
 * mirrored in e2e/global-setup.ts), so no real secrets are required.
 */
async function loginAs(page: Page, role: 'admin' | 'agent') {
  const email =
    role === 'admin'
      ? process.env.ADMIN_EMAIL ?? 'admin@example.com'
      : process.env.AGENT_EMAIL ?? 'agent@example.com';
  const password =
    role === 'admin'
      ? process.env.ADMIN_PASSWORD ?? 'password123'
      : process.env.AGENT_PASSWORD ?? 'password123';

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/');
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

/**
 * Authentication — covers the full sign-in / sign-out cycle, form validation,
 * and route-level access guards (unauthenticated redirects, admin-only pages).
 */
test.describe('Authentication', () => {
  // -------------------------------------------------------------------------
  // Successful login
  // -------------------------------------------------------------------------

  test.describe('Successful login', () => {
    test('admin can sign in and sees the home page', async ({ page }) => {
      await loginAs(page, 'admin');

      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: /home/i })).toBeVisible();
    });

    test('agent can sign in and sees the home page', async ({ page }) => {
      await loginAs(page, 'agent');

      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: /home/i })).toBeVisible();
    });

    test('after login the navbar is visible with a sign out button', async ({ page }) => {
      await loginAs(page, 'agent');

      await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Invalid credentials / form validation
  // -------------------------------------------------------------------------

  test.describe('Invalid credentials and form validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('shows field error for invalid email format', async ({ page }) => {
      await page.getByLabel(/email/i).fill('not-an-email');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/invalid email address/i)).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('shows field error when password is empty', async ({ page }) => {
      await page.getByLabel(/email/i).fill('admin@example.com');
      // Leave password blank
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/password is required/i)).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('shows field errors when both email and password are empty', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).click();

      // Both field-level messages should appear
      await expect(page.getByText(/invalid email address/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('shows error message for correct email but wrong password', async ({ page }) => {
      await page.getByLabel(/email/i).fill('admin@example.com');
      await page.getByLabel(/password/i).fill('wrong-password');
      await page.getByRole('button', { name: /sign in/i }).click();

      // better-auth returns a server-side error; the form surfaces it as a root error
      await expect(
        page.locator('p.text-destructive, [role="alert"]').first(),
      ).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('shows error message for non-existent email', async ({ page }) => {
      await page.getByLabel(/email/i).fill('nobody@example.com');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(
        page.locator('p.text-destructive, [role="alert"]').first(),
      ).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('button is disabled and shows loading text while submitting', async ({ page }) => {
      // Slow down the network so we can catch the interim state
      await page.route('**/api/auth/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.continue();
      });

      await page.getByLabel(/email/i).fill('admin@example.com');
      await page.getByLabel(/password/i).fill('password123');

      const button = page.getByRole('button', { name: /sign in/i });
      await button.click();

      // During the in-flight request the button text changes and it is disabled
      await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Authentication gates — unauthenticated redirects
  // -------------------------------------------------------------------------

  test.describe('Authentication gates (unauthenticated access)', () => {
    test('visiting / while unauthenticated redirects to /login', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/login');
    });

    test('visiting /users while unauthenticated redirects to /login', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL('/login');
    });

    test('the login page is accessible when unauthenticated', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL('/login');
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Redirect away from /login when already authenticated
  // -------------------------------------------------------------------------

  test.describe('Redirect from /login when already authenticated', () => {
    test('authenticated admin visiting /login is redirected to /', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/login');
      await expect(page).toHaveURL('/');
    });

    test('authenticated agent visiting /login is redirected to /', async ({ page }) => {
      await loginAs(page, 'agent');
      await page.goto('/login');
      await expect(page).toHaveURL('/');
    });
  });

  // -------------------------------------------------------------------------
  // Admin-only route (/users)
  // -------------------------------------------------------------------------

  test.describe('Admin-only route (/users)', () => {
    test('admin can access /users', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/users');
      await expect(page).toHaveURL('/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    });

    test('admin navbar shows a Users link', async ({ page }) => {
      await loginAs(page, 'admin');
      await expect(page.getByRole('link', { name: /users/i })).toBeVisible();
    });

    test('agent visiting /users is redirected to /', async ({ page }) => {
      await loginAs(page, 'agent');
      await page.goto('/users');
      await expect(page).toHaveURL('/');
    });

    test('agent navbar does not show a Users link', async ({ page }) => {
      await loginAs(page, 'agent');
      await expect(page.getByRole('link', { name: /users/i })).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Sign-out flow
  // -------------------------------------------------------------------------

  test.describe('Sign-out flow', () => {
    test('admin can sign out and is redirected to /login', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('/login');
      await expect(page).toHaveURL('/login');
    });

    test('agent can sign out and is redirected to /login', async ({ page }) => {
      await loginAs(page, 'agent');
      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('/login');
      await expect(page).toHaveURL('/login');
    });

    test('after sign out, visiting / redirects back to /login', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('/login');

      await page.goto('/');
      await expect(page).toHaveURL('/login');
    });

    test('after sign out, the sign-in form is shown again', async ({ page }) => {
      await loginAs(page, 'agent');
      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('/login');

      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });
  });
});
