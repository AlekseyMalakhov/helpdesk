---
name: Architecture Overview
description: Confirmed stack, roles, auth mechanism, key file locations for the helpdesk monorepo
type: project
---

Bun monorepo: server (Express 5 + Prisma 6 + PostgreSQL, port 3000) and client (React 19 + Vite 6 + React Router 7, port 5173). Auth via better-auth with email+password; sign-up disabled (disableSignUp: true). Two roles: admin and agent (stored as PostgreSQL enum). Sessions managed by better-auth's Prisma adapter (no express-session).

Key files:
- server/src/lib/auth.ts — better-auth config
- server/src/index.ts — Express app, middleware, route registration
- server/src/prisma/seed.ts — seeds admin (from env) and agent (hardcoded credentials)
- server/prisma/schema.prisma — User, Session, Account, Verification models
- client/src/lib/auth-client.ts — authClient with inferAdditionalFields plugin
- client/src/App.tsx — ProtectedLayout, client-side route guards
- server/.env.example — committed to git (contains placeholder credentials)

**Why:** Understanding the full architecture is needed before each future security review session.
**How to apply:** Use as baseline when reviewing new features or changes for security impact.
