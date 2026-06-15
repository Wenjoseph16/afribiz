# Development Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Git

## Installation

### 1. Clone and Install Dependencies

```bash
cd afribiz
npm install
```

This will install dependencies for all packages (frontend, backend, shared).

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Backend
DATABASE_URL=postgresql://postgres:password@localhost:5432/afribiz
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
FRONTEND_URL=http://localhost:3000

# Email (optional for development)
SMTP_HOST=localhost
SMTP_PORT=1025
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Seed default data
npm run db:seed
```

### 4. Start Development Servers

Terminal 1 - Frontend:
```bash
npm run dev --workspace=frontend
```

Terminal 2 - Backend:
```bash
npm run dev --workspace=backend
```

Frontend: http://localhost:3000
Backend: http://localhost:3001/api

## Available Commands

### Root Level
```bash
# Start all services
npm run dev

# Build all packages
npm run build

# Type check all packages
npm run type-check

# Lint all packages
npm run lint

# Format all packages
npm run format
```

### Frontend
```bash
cd frontend
npm run dev         # Development server
npm run build       # Production build
npm run start       # Start production build
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript
```

### Backend
```bash
cd backend
npm run dev         # Development with hot reload
npm run build       # Compile TypeScript
npm run start       # Start compiled server
npm run db:migrate  # Create new migration
npm run db:seed     # Seed database
npm run db:studio   # Open Prisma Studio
```

## Database Operations

### Open Prisma Studio
```bash
cd backend
npm run db:studio
```

This opens a GUI for database management at http://localhost:5555

### Create New Migration
```bash
cd backend
npx prisma migrate dev --name add_new_table
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

**Warning**: This deletes all data!

### View Migrations
```bash
cd backend
npx prisma migrate status
```

## Debugging

### Backend Debugging with VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend Debug",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "runtimeArgs": ["--loader", "tsx/esm"],
      "outFiles": ["${workspaceFolder}/**/*.js"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Frontend Debugging

Built-in Next.js debugging in VS Code. Add to `.vscode/launch.json`:

```json
{
  "type": "chrome",
  "request": "attach",
  "name": "Attach to Chrome",
  "urlFilter": "http://localhost:3000/**",
  "pathMapping": {
    "/": "${workspaceFolder}/frontend/",
    "/_next": "${workspaceFolder}/frontend/.next/"
  }
}
```

## Testing

### Run Tests (when added)
```bash
npm run test --workspaces
```

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```

**Solution**: Check PostgreSQL is running and DATABASE_URL is correct

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**: Change PORT in .env or kill the process using that port

### Module Not Found
```
Error: Cannot find module '@/...'
```

**Solution**: Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check TypeScript errors
npm run type-check --workspace=frontend
npm run type-check --workspace=backend
```

### Prisma Client Error
```bash
# Regenerate Prisma client
cd backend
npx prisma generate
```

## Git Workflow

1. Create feature branch:
```bash
git checkout -b feature/your-feature
```

2. Make changes and commit:
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push and create PR:
```bash
git push origin feature/your-feature
```

## Code Style

- **ESLint**: Enabled
- **Prettier**: Enabled
- **TypeScript**: Strict mode

Format before committing:
```bash
npm run format --workspaces
```

## Performance Tips

1. Use React Query for data fetching
2. Memoize components with React.memo
3. Lazy load routes and components
4. Use proper TypeScript types
5. Monitor bundle size

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
