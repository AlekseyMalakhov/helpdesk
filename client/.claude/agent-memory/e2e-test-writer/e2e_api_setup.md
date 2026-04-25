---
name: API Direct-Creation Pattern
description: How to create test fixture users via page.request to avoid UI coupling in E2E test setup
type: project
---

When an edit or delete test needs a fresh user to act on, create it via the API rather than through the UI form. This keeps `beforeEach` fast and avoids coupling setup to the Create User modal.

The session cookie from `loginAs` is automatically reused by `page.request`, so the POST is already authenticated:

```typescript
async function createUserViaApi(page: Page, name: string, email: string): Promise<void> {
  const response = await page.request.post('/api/users', {
    data: { name, email, password: 'Password123!' },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create user via API: ${response.status()} ${await response.text()}`);
  }
}
```

Call this in `beforeEach` after `loginAs` (which establishes the cookie), then `goto('/users')` and wait for the new user's email to appear before proceeding.

**Why:** Avoids brittle dependency on the Create User modal working correctly just to get into position for a different test. Also confirmed that `page.request` shares the same session as `page` navigation.
