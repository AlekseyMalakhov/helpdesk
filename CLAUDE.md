# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Use the **context7 MCP server** to fetch up-to-date docs before working with any library in this project (Express, Prisma, Vite, React Router, Bun, etc). Training data may be outdated.

## Project

AI-powered helpdesk ticket management system. Tickets have statuses (open, resolved, closed) and categories (general question, technical question, refund request). Two roles: admin (created at deployment) and agent (created by admin).

See `project-scope.md`, `tech-stack.md`, and `implementation-plan.md` for full context.

## Monorepo Structure

Bun workspaces monorepo. Root `package.json` declares `["client", "server"]` as workspaces.

```
helpdesk/
  client/   # React 19 + TypeScript + Vite 6 + React Router 7
  server/   # Express 5 + TypeScript + Prisma 6, runs on Bun
```

## Commands

All commands require Bun (`~/.bun/bin/bun`). Install: `powershell -c "irm bun.sh/install.ps1 | iex"`.

**Install dependencies** (from root):
```
bun install
```

**Run server** (port 3000):
```
cd server && bun dev        # watch mode
```

**Run client** (port 5173):
```
cd client && bun dev
```

**Database** (requires Docker):
```
docker compose up -d                        # start PostgreSQL (port 5432) + test PostgreSQL (port 5433)
cd server && bun db:migrate                 # run migrations
cd server && bun db:seed                    # seed admin + agent users
cd server && bun db:generate                # regenerate Prisma client after schema changes
```

**E2E tests** (requires Docker running):
```
bun test:e2e                                # run all tests headlessly
bun test:e2e:ui                             # open Playwright UI
bunx playwright show-report                 # view last HTML report
```

## Architecture

### Server (`server/`)

- Entry point: `src/index.ts` — creates the Express app, registers middleware and routes, starts the listener
- All routes are prefixed with `/api`
- Database access goes through the Prisma client (`@prisma/client`)
- Schema lives in `prisma/schema.prisma`; edit it then run `bun db:migrate` + `bun db:generate`
- Env vars documented in `.env.example` — copy to `.env` before running

### Client (`client/`)

- Entry point: `src/main.tsx` — mounts React with `BrowserRouter`, renders `App`
- Routes are defined in `src/App.tsx`
- All fetch calls use relative paths (e.g. `/api/health`); Vite proxies `/api/*` to `http://localhost:3000` in dev — no CORS issues during development
- Path alias `@` → `./src` configured in both `vite.config.ts` and `tsconfig.json`
- `src/lib/utils.ts` exports `cn()` helper (clsx + tailwind-merge)

#### Tailwind CSS v4

Uses `@tailwindcss/vite` plugin (no `tailwind.config.js`). Theme lives in `src/index.css` as CSS variables.

#### shadcn/ui

Installed manually (CLI `init` is interactive and incompatible with this setup). Config at `client/components.json` (style: default, baseColor: neutral, cssVariables: true). To add components:

```
cd client && bunx --bun shadcn add <component> --yes
```

Do **not** re-run `shadcn init` — it will overwrite the existing Tailwind v4 CSS setup.

### Authentication

Uses **better-auth** (not express-session). Key facts:

- Server: `src/lib/auth.ts` creates the `auth` instance with the Prisma adapter (PostgreSQL) and email+password strategy. **Sign-up is disabled** — only the seeded admin exists; agents are created by the admin.
- The `role` field is exposed in the session via `user.additionalFields` in `auth.ts` — without this, better-auth omits it from the session payload even though it exists in the DB.
- Server entry: `app.all("/api/auth/*splat", toNodeHandler(auth))` mounts all better-auth routes under `/api/auth/`.
- Client: `src/lib/auth-client.ts` exports `authClient` with the `inferAdditionalFields<typeof auth>()` plugin (type-only import from the server) so `session.user.role` is properly typed as `"admin" | "agent"` — no casts needed. Use `authClient.signIn.email()` to sign in and `authClient.useSession()` to read the current session in React.
- Trusted origins are set via `TRUSTED_ORIGINS` env var (comma-separated); defaults to `http://localhost:5173`.
- Better-auth manages its own session tables via the Prisma adapter — do not add manual session middleware.

#### Routing & role guards (`client/src/App.tsx`)

- `ProtectedLayout` accepts a `children` prop and wraps any page with `NavBar`.
- Unauthenticated users are redirected to `/login` from all protected routes.
- `/users` is admin-only: non-admin authenticated users are redirected to `/`.
- Check role with `session?.user.role === 'admin'` (typed via `inferAdditionalFields`).

#### Seeding (`server/src/prisma/seed.ts`)

- `bun db:seed` creates both the admin user (from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars) and a fixed agent user (`agent@example.com` / `password123`).
- Uses a shared `createUser` helper — add more seed users there.

### E2E Testing

Uses **Playwright** (`@playwright/test`) installed at the root. Config at `playwright.config.ts`. Tests live in `e2e/`.

When writing E2E tests, always use the **`e2e-test-writer` agent** — it has full context on the test infrastructure, Playwright conventions, selector strategy, and project-specific patterns for this codebase.

### AI features

Anthropic Claude API handles ticket classification, summaries, and suggested replies — all three features go through one client instance in the server.
