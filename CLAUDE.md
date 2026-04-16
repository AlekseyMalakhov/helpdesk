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
docker compose up -d                        # start PostgreSQL
cd server && bun db:migrate                 # run migrations
cd server && bun db:seed                    # seed admin user
cd server && bun db:generate                # regenerate Prisma client after schema changes
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

### Database sessions (auth)

Sessions are stored in PostgreSQL via the `Session` model. No third-party auth library — `express-session` + `connect-pg-simple` manage the session lifecycle directly.

### AI features

Anthropic Claude API handles ticket classification, summaries, and suggested replies — all three features go through one client instance in the server.
