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

/**
 * Creates a new agent user via the API directly, bypassing the UI, so that
 * edit/delete tests start with a known fresh user without depending on the
 * seeded agent. Returns the user's name and email so assertions can reference
 * the exact strings.
 */
async function createUserViaApi(
  page: Page,
  name: string,
  email: string,
): Promise<void> {
  const response = await page.request.post('/api/users', {
    data: { name, email, password: 'Password123!' },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to create user via API: ${response.status()} ${await response.text()}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

/**
 * User management (CRUD) — covers listing users, creating a new agent,
 * editing an existing user's name, and soft-deleting an agent.
 * All tests require the admin role since /users is admin-only.
 */
test.describe('User management', () => {
  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------

  test.describe('List users', () => {
    test('admin sees the users table with seeded users on /users', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/users');

      await expect(page).toHaveURL('/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // The table should contain both seeded users
      await expect(page.getByText('admin@example.com')).toBeVisible();
      await expect(page.getByText('agent@example.com')).toBeVisible();
    });

    test('table columns are rendered', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/users');

      await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /email/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /created/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /actions/i })).toBeVisible();
    });

    test('Create User button is visible on the page', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/users');

      await expect(page.getByRole('button', { name: /create user/i })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  test.describe('Create user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/users');
    });

    test('creates a new agent and the new user appears in the table', async ({ page }) => {
      await page.getByRole('button', { name: /create user/i }).click();

      // Dialog should be open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /create user/i })).toBeVisible();

      // Fill in the form
      await page.getByLabel(/^name$/i).fill('New Test Agent');
      await page.getByLabel(/^email$/i).fill('new-test-agent@example.com');
      await page.getByLabel(/^password$/i).fill('Password123!');

      // Submit and wait for the API response
      await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/users') && res.status() === 201,
        ),
        page.getByRole('button', { name: /^create user$/i }).click(),
      ]);

      // Dialog should close and the new user should be in the table
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByText('New Test Agent')).toBeVisible();
      await expect(page.getByText('new-test-agent@example.com')).toBeVisible();
    });

    test('Create User dialog can be cancelled without side-effects', async ({ page }) => {
      await page.getByRole('button', { name: /create user/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: /cancel/i }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Edit
  // -------------------------------------------------------------------------

  test.describe('Edit user', () => {
    let editTargetName: string;
    let editTargetEmail: string;

    test.beforeEach(async ({ page }) => {
      const suffix = Date.now();
      editTargetName = `Edit Target Agent ${suffix}`;
      editTargetEmail = `edit-target-agent-${suffix}@example.com`;
      await loginAs(page, 'admin');
      await createUserViaApi(page, editTargetName, editTargetEmail);
      await page.goto('/users');
      // Wait for the freshly-created user to appear before interacting
      await expect(page.getByText(editTargetEmail)).toBeVisible();
    });

    test('updates a user name and the new name appears in the table', async ({ page }) => {
      await page.getByRole('button', { name: `Edit ${editTargetName}` }).click();

      // Dialog should be open with the current values pre-filled
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /edit user/i })).toBeVisible();

      const nameInput = page.getByLabel(/^name$/i);
      await expect(nameInput).toHaveValue(editTargetName);

      // Clear the name and type a new one
      await nameInput.clear();
      await nameInput.fill('Updated Agent Name');

      // Submit and wait for the API response
      await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/users') && res.status() === 200,
        ),
        page.getByRole('button', { name: /save changes/i }).click(),
      ]);

      // Dialog should close and updated name should be in the table
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByText('Updated Agent Name')).toBeVisible();
      // Old name should be gone
      await expect(page.getByText(editTargetName)).not.toBeVisible();
    });

    test('Edit dialog is pre-filled with the current user values', async ({ page }) => {
      await page.getByRole('button', { name: `Edit ${editTargetName}` }).click();

      await expect(page.getByLabel(/^name$/i)).toHaveValue(editTargetName);
      await expect(page.getByLabel(/^email$/i)).toHaveValue(editTargetEmail);
      await expect(page.getByLabel(/^password$/i)).toHaveValue('');
    });

    test('Edit dialog can be cancelled without changing the row', async ({ page }) => {
      await page.getByRole('button', { name: `Edit ${editTargetName}` }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByLabel(/^name$/i).clear();
      await page.getByLabel(/^name$/i).fill('Should Not Be Saved');

      await page.getByRole('button', { name: /cancel/i }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible();
      // Original name must still be in the table
      await expect(page.getByText(editTargetName)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  test.describe('Delete user', () => {
    let deleteTargetName: string;
    let deleteTargetEmail: string;

    test.beforeEach(async ({ page }) => {
      const suffix = Date.now();
      deleteTargetName = `Delete Target Agent ${suffix}`;
      deleteTargetEmail = `delete-target-agent-${suffix}@example.com`;
      await loginAs(page, 'admin');
      await createUserViaApi(page, deleteTargetName, deleteTargetEmail);
      await page.goto('/users');
      // Wait for the freshly-created user to appear before interacting
      await expect(page.getByText(deleteTargetEmail)).toBeVisible();
    });

    test('deletes an agent and the row is removed from the table', async ({ page }) => {
      await page.getByRole('button', { name: `Delete ${deleteTargetName}` }).click();

      // Confirmation dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /delete user/i })).toBeVisible();
      await expect(
        page.getByText(new RegExp(`delete\\s+${deleteTargetName}`, 'i')),
      ).toBeVisible();

      // Confirm the deletion and wait for the API response
      await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/users') && res.status() === 204,
        ),
        page.getByRole('button', { name: /^delete$/i }).click(),
      ]);

      // Dialog should close and the user should no longer be in the table
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByText(deleteTargetEmail)).not.toBeVisible();
      await expect(page.getByText(deleteTargetName)).not.toBeVisible();
    });

    test('Delete dialog can be cancelled and the row remains in the table', async ({ page }) => {
      await page.getByRole('button', { name: `Delete ${deleteTargetName}` }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: /cancel/i }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible();
      // User should still be in the table
      await expect(page.getByText(deleteTargetEmail)).toBeVisible();
    });

    test('admin row does not have a delete button', async ({ page }) => {
      const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
      // Find the admin row by email cell text, then check its row for delete button absence.
      // The table is small enough that a global scope assertion is reliable here.
      const adminRow = page.getByRole('row').filter({ hasText: adminEmail });
      await expect(adminRow.getByRole('button', { name: /delete/i })).not.toBeVisible();
    });
  });
});
