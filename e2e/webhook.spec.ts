import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/inbound-email';
const WEBHOOK_SECRET = 'test-webhook-secret';

/** A minimal valid body that satisfies inboundEmailSchema. */
const VALID_BODY = {
  subject: 'Help with my order',
  body: 'I need assistance with order #12345.',
  senderEmail: 'customer@example.com',
  senderName: 'Alice Customer',
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

/**
 * Inbound-email webhook — covers the POST /api/webhooks/inbound-email endpoint.
 * All tests use Playwright's APIRequestContext (the `request` fixture) and talk
 * directly to the Express server on port 3001; no browser or UI is involved.
 */
test.describe('Inbound-email webhook', () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test.describe('Success', () => {
    test('valid auth + valid body returns 201 with an id field', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: VALID_BODY,
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(typeof body.id).toBe('number');
      expect(body.id).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Authentication failures
  // -------------------------------------------------------------------------

  test.describe('Authentication failures', () => {
    test('missing Authorization header returns 401', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        data: VALID_BODY,
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    test('wrong secret in Authorization header returns 401', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: 'Bearer wrong-secret' },
        data: VALID_BODY,
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    test('malformed Authorization header (no Bearer prefix) returns 401', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: WEBHOOK_SECRET },
        data: VALID_BODY,
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });
  });

  // -------------------------------------------------------------------------
  // Validation failures — missing required fields
  // -------------------------------------------------------------------------

  test.describe('Validation failures — missing required fields', () => {
    test('missing subject returns 400', async ({ request }) => {
      const { subject: _omitted, ...bodyWithoutSubject } = VALID_BODY;

      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: bodyWithoutSubject,
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    test('missing body field returns 400', async ({ request }) => {
      const { body: _omitted, ...bodyWithoutBody } = VALID_BODY;

      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: bodyWithoutBody,
      });

      expect(response.status()).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error');
      expect(typeof responseBody.error).toBe('string');
    });

    test('missing senderEmail returns 400', async ({ request }) => {
      const { senderEmail: _omitted, ...bodyWithoutEmail } = VALID_BODY;

      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: bodyWithoutEmail,
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    test('missing senderName returns 400', async ({ request }) => {
      const { senderName: _omitted, ...bodyWithoutName } = VALID_BODY;

      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: bodyWithoutName,
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Validation failures — invalid field values
  // -------------------------------------------------------------------------

  test.describe('Validation failures — invalid field values', () => {
    test('invalid email format for senderEmail returns 400', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: { ...VALID_BODY, senderEmail: 'not-a-valid-email' },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    test('empty string subject returns 400 (min(1) violated)', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: { ...VALID_BODY, subject: '' },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    test('empty string body returns 400 (min(1) violated)', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: { ...VALID_BODY, body: '' },
      });

      expect(response.status()).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error');
      expect(typeof responseBody.error).toBe('string');
    });

    test('empty string senderName returns 400 (min(1) violated)', async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        data: { ...VALID_BODY, senderName: '' },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });
  });
});
