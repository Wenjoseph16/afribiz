# Shared Types & Utilities README

# AfriBiz Shared Package

Shared TypeScript types, interfaces, and utilities used across frontend and backend.

## Purpose

This package provides:
- Consistent type definitions
- Shared interfaces for API contracts
- Common utilities
- Type-safe communication between frontend and backend

## Structure

```
src/
├── types/
│   └── index.ts       # All type definitions
├── constants/
│   └── index.ts       # Shared constants
└── utils/
    └── index.ts       # Shared utilities
```

## Usage

### In Frontend

```typescript
import type { User, ApiResponse } from '@afribiz/shared';

const response: ApiResponse<User> = await api.get('/users/me');
```

### In Backend

```typescript
import { User, ApiResponse } from '@afribiz/shared';

const user: User = await prisma.user.findUnique({ where: { id } });
res.json<ApiResponse<User>>({ success: true, data: user });
```

## Exported Types

### ApiResponse
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
```

### Authentication
- `LoginRequest`
- `SignupRequest`
- `AuthResponse`

### Pagination
- `PaginationParams`
- `PaginatedResponse<T>`

## Contributing

When adding new shared types:
1. Add to `src/types/index.ts`
2. Export from `src/index.ts`
3. Update both frontend and backend package.json dependencies
4. Run `npm install` in root

## Building

```bash
npm run build
```

Outputs compiled types to `dist/` folder.

## TypeScript Checking

```bash
npm run type-check
```

## License

MIT
