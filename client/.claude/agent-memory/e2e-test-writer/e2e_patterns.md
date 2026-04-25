---
name: E2E Patterns & Conventions
description: Playwright conventions, helpers, selector strategy, and test structure observed in this helpdesk project
type: project
---

## Test infrastructure

- Config: `playwright.config.ts` at repo root
- Tests: `e2e/` directory at repo root
- Global setup: `e2e/global-setup.ts` — runs `prisma migrate reset --force` then `bun src/prisma/seed.ts` before every run
- Workers: 1 (sequential) — tests share the same DB within a run
- Base URL: `http://localhost:5174` (Vite dev server in test mode)
- Server port: `3001` (started with `bun --env-file .env.test src/index.ts`)
- Env vars: baked into `server/.env.test` — `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AGENT_EMAIL`, `AGENT_PASSWORD` all `=admin@example.com/agent@example.com` with `password123`

## loginAs helper (canonical form)

```typescript
async function loginAs(page: Page, role: 'admin' | 'agent') {
  const email = role === 'admin'
    ? process.env.ADMIN_EMAIL ?? 'admin@example.com'
    : process.env.AGENT_EMAIL ?? 'agent@example.com';
  const password = role === 'admin'
    ? process.env.ADMIN_PASSWORD ?? 'password123'
    : process.env.AGENT_PASSWORD ?? 'password123';
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/');
}
```

Each spec file defines this helper locally (not a shared import) — matches the pattern in `auth.spec.ts`.

## File and describe structure

- One spec per feature: `auth.spec.ts`, `users.spec.ts`, etc.
- Outer `test.describe('Feature name', ...)` with JSDoc comment
- Inner `test.describe` blocks by sub-feature or scenario group
- `test.beforeEach` for shared setup (login + navigate)

## Selector priority

1. `getByRole()` — heading, button, dialog, row, columnheader
2. `getByLabel()` — form inputs (shadcn FormLabel wraps the input)
3. `getByText()` — cell content, email addresses, names in table rows
4. Avoid CSS class selectors entirely (exception: `auth.spec.ts` uses `p.text-destructive` as a fallback for error messages that have no semantic role)

## Waiting strategy

- `page.waitForURL()` after navigation
- `page.waitForResponse()` after mutations (wrap in `Promise.all` with the click)
- Never use `waitForTimeout()`

## Mutation assertions

Pattern used for create/edit/delete:
```typescript
await Promise.all([
  page.waitForResponse(
    (res) => res.url().includes('/api/users') && res.status() === 201,
  ),
  page.getByRole('button', { name: /^create user$/i }).click(),
]);
```

## Delete is soft — server sets `deletedAt`, GET filters with `where: { deletedAt: null }`

## data-testid usage

No `data-testid` attributes exist yet in this codebase. All selectors use role/label/text.

## aria-labels on action buttons (UsersTable)

- Edit: `aria-label="Edit {user.name}"`
- Delete: `aria-label="Delete {user.name}"` — only rendered for non-admin rows
