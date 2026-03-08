# Agent Guidelines for project-3

This document provides guidelines for AI agents working in this repository.

## Project Overview

- **Type**: TypeScript/Express REST API with PostgreSQL
- **Main entry**: `src/server.ts`
- **Database**: PostgreSQL via Prisma ORM

## Available Commands

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `npm run build`           | Compile TypeScript to JavaScript (`tsc`)                   |
| `npm run start`           | Run compiled server (`node dist/server.js`)                |
| `npm run dev`             | Development server with hot reload (`nodemon` + `ts-node`) |
| `npm run lint`            | Run ESLint on `src/**/*.ts`                                |
| `npm run prisma:generate` | Generate Prisma client                                     |
| `npm run prisma:push`     | Push schema to database                                    |
| `npm run prisma:pull`     | Pull schema from database                                  |
| `npm run prisma:seed`     | Seed database                                              |

**Note**: No test framework is currently configured. The `test` script is a placeholder.

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** (`tsconfig.json`)
- Target: ES2020
- Module system: CommonJS

### File Structure

```
src/
├── server.ts           # Express app entry point
├── routes/             # Route definitions
│   ├── router.ts       # Main router aggregating sub-routes
│   ├── auth.router.ts
│   ├── users.router.ts
│   ├── rooms.router.ts
│   └── dashboard.router.ts
├── controllers/        # Request handlers
├── services/           # Business logic
├── validators/        # Zod schemas for request validation
├── middleware/        # Express middleware
├── config/           # Configuration files
└── lib/              # Shared utilities (e.g., Prisma client)
```

### Naming Conventions

- **Files**: kebab-case (e.g., `auth.controller.ts`, `dashboard.router.ts`)
- **Variables/functions**: camelCase
- **Classes/Types**: PascalCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Database fields**: snake_case (enforced in Prisma schema)

### Imports

- Use relative paths for local imports (e.g., `import authService from "../services/auth.service"`)
- Default exports for modules
- Use named exports for types and schemas

### Validation

- Use **Zod** for request validation (see `src/validators/dashboard.ts`)
- Define schemas with explicit types using `z.infer`

### Error Handling

- TODO: Implement proper error handling middleware
- TODO: Add structured error responses

### Prisma

- Schema located at `prisma/schema.prisma`
- Models use snake_case naming with `@map` for column names
- Run `npm run prisma:generate` after modifying schema

### General Guidelines

1. **No comments** unless explicitly required
2. Use **tabs** for indentation (2 spaces)
3. Prefer `const` over `let`
4. Use explicit types rather than `any` when possible
5. Use async/await for asynchronous operations

## Environment Variables

Required variables (see `.env`):

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)

## Docker

- `docker-compose.yml` for PostgreSQL service
- Build/deploy workflow at `.github/workflows/deploy.yml`

## Database Schema

The project uses Prisma with PostgreSQL. Key models include User, Subject, Room, DeviceIoT, ClassSession, Attendance. Some models appear imported from another project and may not be actively used.

## API Endpoints

The application uses RESTful routing with the following structure:

- `/` - Root endpoint (returns "Hello World")
- `/auth` - Authentication endpoints (login, register, logout, refresh token)
- `/users` - User management endpoints
- `/rooms` - Room management endpoints
- `/dashboard` - Dashboard data endpoints

### Route Pattern

Routes use `router.use("/module-name", moduleRouter)` (see `src/routes/router.ts`).

### Controller Pattern

Controllers handle HTTP requests and delegate to services. Example:

```typescript
const authController = {
  handleLogin: (req: any, res: any) => {
    const { email, password } = req.body;
    const result = authService.login(email, password);
    res.send(result);
  },
};
export default authController;
```

### Service Pattern

Services contain business logic and return data directly:

```typescript
const authService = {
  login: (email: string, password: string) => {
    /* TODO */
  },
};
export default authService;
```

## Request/Response Patterns

- Request body via `req.body`, query params via `req.query`, route params via `req.params`
- Use Zod schemas to validate request bodies (see `src/validators/dashboard.ts`)

## Working with Prisma

1. Edit `prisma/schema.prisma` to modify models
2. Run `npm run prisma:generate` to regenerate the client
3. Use `npm run prisma:push` to push schema changes to the database
4. Import Prisma client: `import { PrismaClient } from "@prisma/client"`

## Running Single Tests

No test framework is configured. To add tests, install Jest or Vitest, configure test scripts in `package.json`, then run `npm test -- --testPathPattern=filename`.

## Current Status

- Basic Express server setup with routing
- Prisma client configured
- Auth, Users, Rooms, Dashboard routes stubbed
- Zod validation in use
- **Many TODO items** remain unimplemented
