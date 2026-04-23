---
name: auth-page-selectors-and-patterns
description: Selectors, page structure, and helper patterns discovered while writing auth.spec.ts
type: project
---

## Login page (`client/src/pages/LoginPage.tsx`)
- Email field: `getByLabel(/email/i)` — rendered by shadcn `FormLabel` → `<label>Email</label>` wrapping an `<Input type="text">`
- Password field: `getByLabel(/password/i)` — same pattern, `<Input type="password">`
- Submit button: `getByRole('button', { name: /sign in/i })` — text is "Sign in" (idle) or "Signing in…" (submitting)
- Client-side field errors: `getByText(/invalid email address/i)` and `getByText(/password is required/i)` — rendered by `<FormMessage />`
- Server-side root error: `p.text-destructive` — a `<p>` with Tailwind class `text-destructive` rendered when `form.formState.errors.root` is set

## NavBar (`client/src/components/NavBar.tsx`)
- Sign-out button: `getByRole('button', { name: /sign out/i })`
- Users nav link (admin-only): `getByRole('link', { name: /users/i })`
- User name: `getByText(session.user.name)` — no dedicated testid

## Home page (`client/src/pages/HomePage.tsx`)
- Heading: `getByRole('heading', { name: /home/i })`

## Users page (`client/src/pages/UsersPage.tsx`)
- Heading: `getByRole('heading', { name: /users/i })`

## `loginAs` helper
Lives directly in `e2e/auth.spec.ts` (file-local). Falls back to hardcoded seed values so it works even if env vars are not forwarded.

**Why:** No shared helpers file yet — each spec file defines its own local helper. If multiple spec files need login, extract to `e2e/helpers.ts`.

**How to apply:** Copy the `loginAs` function verbatim into new spec files, or refactor into a shared module when a second spec file needs it.

## Route guard behaviour (from `client/src/App.tsx`)
- Unauthenticated → any protected route → redirect `/login`
- Authenticated → `/login` → redirect `/`
- Authenticated agent → `/users` → redirect `/`
- Authenticated admin → `/users` → page renders normally
