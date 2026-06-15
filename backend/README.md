# Backend README

# AfriBiz Backend

An enterprise-grade Express.js API server with TypeScript, Prisma, and PostgreSQL.

## Features

- ✅ Express.js with TypeScript
- ✅ PostgreSQL + Prisma ORM
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Helmet security middleware
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Comprehensive error handling
- ✅ Logging with Winston
- ✅ Email support with Nodemailer

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Setup database
npx prisma migrate dev

# Seed default data
npm run db:seed

# Run development server
npm run dev
```

Backend will be available at `http://localhost:3001`

## Project Structure

```
src/
├── config/           # Configuration
├── controllers/      # Route handlers
├── services/         # Business logic
├── routes/          # API routes
├── middlewares/     # Express middlewares
├── validators/      # Input validation
├── types/           # TypeScript types
├── utils/           # Utility functions
├── lib/             # Shared libraries
│   ├── jwt.ts       # JWT utilities
│   ├── password.ts  # Password hashing
│   ├── mail.ts      # Email templates
│   └── logger.ts    # Logging
├── prisma/          # Database
│   ├── schema.prisma # DB schema
│   └── seed.ts      # DB seeding
└── server.ts        # Entry point
```

## Available Scripts

```bash
npm run dev         # Development with hot reload
npm run build       # Compile TypeScript
npm run start       # Start compiled server
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run type-check  # Check TypeScript
npm run db:migrate  # Create migration
npm run db:seed     # Seed database
npm run db:studio   # Open Prisma Studio
```

## Database

### Run Migrations

```bash
npx prisma migrate dev --name migration_name
```

### Open Database GUI

```bash
npm run db:studio
```

### Reset Database

```bash
npx prisma migrate reset
```

## API Endpoints

### Health
- `GET /api/health` - Server status

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users (protected)
- `GET /api/users/:id` - Get user (protected)

See `docs/API.md` for complete documentation.

## Security Features

- **Helmet**: Secure HTTP headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: 100 req/15 min
- **Input Validation**: Express Validator
- **Password Hashing**: bcrypt
- **JWT**: Secure tokens
- **HTTP-only Cookies**: CSRF protection

## Environment Variables

See `.env.example` for all variables.

## Database Schema

### Users
- UUID primary key
- Email (unique)
- Hashed password
- Name
- Role (CLIENT, BUSINESS, DEVELOPER, ADMIN)
- Timestamps (createdAt, updatedAt, deletedAt)

### Sessions
- Tracks active sessions
- User agent and IP
- Automatic expiration

### RefreshTokens
- Long-lived tokens
- Revocation support
- Expiration tracking

### AuditLog
- Action tracking
- Change history
- User accountability

## Authentication Flow

1. User signs up/logs in
2. Server returns access & refresh tokens
3. Refresh token stored in HTTP-only cookie
4. Access token used for API requests (Bearer)
5. When access token expires, use refresh token to get new one
6. On logout, revoke refresh token

## Error Handling

All errors follow standard format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

Operational errors expose message. Programming errors hide details in production.

## Logging

Logs stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Errors only

## Key Dependencies

- `express` - Web framework
- `prisma` - ORM
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `express-validator` - Input validation
- `helmet` - Security headers
- `cors` - CORS middleware
- `express-rate-limit` - Rate limiting
- `nodemailer` - Email
- `winston` - Logging

## Coding Standards

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Absolute imports
- Error handling on all routes
- Input validation on all endpoints

## Testing

Tests will be added. Run:

```bash
npm run test
```

## Deployment

### Docker

```bash
docker build -t afribiz-backend .
docker run -p 3001:3001 afribiz-backend
```

### Environment

Production should use:
- HTTPS only
- Environment-based secrets
- Database backups
- Monitoring & logging
- CDN for static files

## Contributing

See `../docs/CONTRIBUTING.md`

## License

MIT
