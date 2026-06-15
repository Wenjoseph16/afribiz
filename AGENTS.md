# AfriBiz AI Agent Instructions

This file is the primary agent customization guide for the AfriBiz monorepo. It is intended for coding agents such as Gemini and other AI assistants to understand the repository layout, commands, conventions, and the most useful documentation links.

## Repository overview
- Monorepo with three main packages:
  - `frontend/` — Next.js 15 App Router web application
  - `backend/` — Express.js API server with TypeScript and Prisma
  - `shared/` — Shared TypeScript types, interfaces, and utilities
- Core docs:
  - [`README.md`](README.md)
  - [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
  - [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)

## Key commands
Use the root workspace scripts when possible.

```bash
npm install
npm run dev
npm run build
npm run lint
npm run format
npm run type-check
```

Package-specific commands:
- `npm run dev --workspace=backend`
- `npm run dev --workspace=frontend`
- `npm run build --workspaces`
- `npm start --workspace=backend`

## Important directories
- `backend/src/`
  - `config/` — environment and runtime configuration
  - `controllers/` — request handlers for routes
  - `services/` — business logic separate from controllers
  - `routes/` — API route definitions
  - `middlewares/` — authentication, error handling, validation
  - `validators/` — input validation logic
  - `lib/` — reusable libraries (JWT, password, mail, logger)
  - `prisma/` — database schema, migrations, seeding
- `frontend/src/`
  - `app/` — Next.js App Router pages and layouts
  - `components/` — reusable UI components
  - `features/` — feature-specific modules
  - `hooks/` — custom React hooks
  - `services/` — API clients and data access
  - `stores/` — Zustand state management
  - `types/` — frontend-specific TypeScript types
- `shared/src/` — shared contracts and type definitions used by both packages

## Development conventions
- TypeScript is required for all new code.
- Use existing helper functions and shared types instead of duplicating logic.
- Respect the backend API response shape:

```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "message": string
}
```

- Frontend uses React Query + Axios for data fetching.
- Backend uses Prisma ORM for database access and Express for routing.
- Maintain code formatting with Prettier and lint rules with ESLint.

## Agent behavior guidance
- Prefer small, focused changes and do not refactor large subsystems unless explicitly requested.
- Link to existing docs rather than copying them into code changes.
- When asked to add new functionality, verify whether it belongs in `frontend/`, `backend/`, or `shared/`.
- If a fix involves environment configuration, reference `.env.example` and existing setup docs.
- If a task spans both frontend and backend, preserve API contracts and shared types.

## Notes for Gemini and related agents
- Treat this file as the repository’s agent customization entrypoint.
- Use the repo structure and docs links to decide where to make changes.
- Avoid inventing new architectural patterns; follow the monorepo’s established frontend/backend/shared separation.

## Useful docs
- [`README.md`](README.md) — install, development workflow, architecture summary
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — deeper architecture and feature overview
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — contribution and development conventions
