---
name: API-only test patterns (request fixture)
description: How to write pure API tests with Playwright's request fixture, including the webhook endpoint pattern
type: project
---

## API-only tests using the `request` fixture

For endpoints with no UI involvement, use Playwright's `request` fixture (APIRequestContext) instead of `page`. This avoids launching a browser for pure HTTP assertion tests.

Key points:
- The `baseURL` in `playwright.config.ts` is `http://localhost:5174` (the client). For direct server calls you must always use the full URL: `http://localhost:3001/api/...`.
- Pass headers via the `headers` option and the JSON body via `data`. Playwright sets `Content-Type: application/json` automatically when `data` is an object.
- Read the response body with `await response.json()`.
- Auth assertions: check `response.status()` directly with `expect(response.status()).toBe(...)`.

Example call pattern:
```ts
const response = await request.post('http://localhost:3001/api/webhooks/inbound-email', {
  headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
  data: { subject: '...', body: '...', senderEmail: '...', senderName: '...' },
});
expect(response.status()).toBe(201);
const json = await response.json();
expect(json).toHaveProperty('id');
```

**Why:** Webhook and other server-side-only routes have no UI; using `request` keeps tests faster and the intent obvious.

**How to apply:** Whenever a test is purely about an API contract (no page navigation, no UI state), skip the `page` fixture entirely and use `request`.

## Webhook secret in .env.test

The file `server/.env.test` must contain `WEBHOOK_SECRET=test-webhook-secret` for the inbound-email webhook tests to pass. This was added as part of writing `e2e/webhook.spec.ts`.

## Destructuring trick for omitting fields in test data

When testing missing-field validation, use destructuring with a discard variable rather than `delete`:
```ts
const { subject: _omitted, ...bodyWithoutSubject } = VALID_BODY;
```
This keeps the `VALID_BODY` const immutable and avoids runtime mutation.
