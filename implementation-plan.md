## Implementation Plan

---

### Phase 1 — Project Setup

- [ ] Initialize monorepo structure with `/client` and `/server` directories
- [ ] Set up Express.js + TypeScript project in `/server`
- [ ] Set up React + TypeScript + Vite project in `/client`
- [ ] Set up PostgreSQL locally via Docker Compose

---

### Phase 2 — Authentication

- [ ] Define `User` model in Prisma schema (id, email, password hash, role: admin | agent, timestamps)
- [ ] Define `Session` model in Prisma schema for database-backed sessions
- [ ] Run initial migration
- [ ] Seed script: create the default admin account
- [ ] `POST /auth/login` — validate credentials, create session, set cookie
- [ ] `POST /auth/logout` — destroy session
- [ ] `GET /auth/me` — return current user from session
- [ ] Auth middleware to protect API routes
- [ ] Login page (form, error states)
- [ ] Protected route wrapper in React Router
- [ ] Redirect unauthenticated users to login

---

### Phase 3 — Ticket Core

- [ ] Define `Ticket` model in Prisma schema (id, subject, body, senderEmail, status, category, assignedAgentId, timestamps)
- [ ] Run migration
- [ ] `GET /tickets` — list tickets with filtering (status, category) and sorting (date, status)
- [ ] `GET /tickets/:id` — ticket detail
- [ ] `PATCH /tickets/:id` — update status, category, assigned agent
- [ ] Ticket list page — table with filter and sort controls
- [ ] Ticket detail page — full ticket view with metadata panel
- [ ] Status badge and category label components

---

### Phase 4 — Email Integration

- [ ] Set up SendGrid or Mailgun account and configure inbound webhook
- [ ] `POST /webhooks/inbound-email` — receive parsed email, create ticket
- [ ] Validate and sanitize inbound webhook payload
- [ ] Attach inbound email body and sender to the created ticket
- [ ] `POST /tickets/:id/reply` — send outbound reply via SendGrid/Mailgun API
- [ ] Store reply content on the ticket (add `Reply` model or replies array)
- [ ] Reply composer UI on ticket detail page

---

### Phase 5 — AI Features

- [ ] Set up Anthropic Claude API client in `/server`
- [ ] Auto-classify ticket on creation — call Claude to assign category (general question / technical question / refund request)
- [ ] `POST /tickets/:id/summarize` — generate and store AI summary
- [ ] `POST /tickets/:id/suggest-reply` — generate a suggested reply using ticket content and category
- [ ] Display AI summary on ticket detail page
- [ ] Display AI-suggested reply in the reply composer (editable before sending)
- [ ] Show AI-assigned category with option for agent to override

---

### Phase 6 — User Management

- [ ] `GET /users` — list all agents (admin only)
- [ ] `POST /users` — create a new agent account (admin only)
- [ ] `PATCH /users/:id` — update agent details (admin only)
- [ ] `DELETE /users/:id` — deactivate agent (admin only)
- [ ] User management page (admin only) — list, create, deactivate agents
- [ ] Guard user management routes by role on both frontend and backend

---

### Phase 7 — Dashboard

- [ ] `GET /dashboard/stats` — return ticket counts by status and category
- [ ] Dashboard page — summary cards (open, resolved, closed ticket counts)
- [ ] Breakdown by category
- [ ] Recent tickets list on dashboard

---

### Phase 8 — Deployment

- [ ] Write `Dockerfile` for `/server`
- [ ] Write `Dockerfile` for `/client` (static build served via nginx)
- [ ] Write production `docker-compose.yml` (server, client, postgres)
- [ ] Configure environment variables for production
- [ ] Deploy to chosen cloud provider (Railway, Fly.io, or AWS)
- [ ] Verify inbound email webhook works against the deployed URL
