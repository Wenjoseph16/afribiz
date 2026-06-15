# AfriBiz Architecture Overview

## Project Structure

AfriBiz is built as a monorepo with three main packages:

### Frontend (`/frontend`)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + Shadcn UI
- **State Management**: Zustand
- **Data Fetching**: React Query + Axios
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion

### Backend (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + Refresh Tokens
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Email**: Nodemailer

### Shared (`/shared`)
- TypeScript type definitions
- Shared interfaces and contracts
- Utility functions

## Database Schema

### Core Tables

#### Users
- Stores user account information
- References to roles
- Audit timestamps (createdAt, updatedAt, deletedAt)

#### Roles
- Defines user roles (CLIENT, BUSINESS, DEVELOPER, ADMIN)
- Links users to roles

#### Sessions
- Tracks active user sessions
- Stores user agent and IP address
- Automatic expiration

#### RefreshTokens
- Stores refresh tokens for long-lived sessions
- Supports token revocation
- Automatic cleanup of expired tokens

#### AuditLog
- Tracks all important system actions
- Stores what changed and by whom

## Authentication Flow

1. **Signup/Login** → `/api/auth/signup` or `/api/auth/login`
2. **Access Token** → Valid for 15 minutes
3. **Refresh Token** → Valid for 7 days (HTTP-only cookie)
4. **Refresh** → `/api/auth/refresh` to get new access token
5. **Logout** → `/api/auth/logout` revokes tokens

## Security Features

- **Helmet**: Sets secure HTTP headers
- **CORS**: Controls cross-origin requests
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **Password Hashing**: bcrypt with salt rounds
- **JWT**: Secure token-based authentication
- **Input Validation**: Express Validator + Zod
- **HTTP-only Cookies**: Protects refresh tokens from XSS

## API Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "message": string
}
```

## User Roles

- **CLIENT**: End users of the marketplace
- **BUSINESS**: Sellers on the marketplace
- **DEVELOPER**: API consumers and integrators
- **ADMIN**: Platform administrators

## Directory Structure

```
/backend/src
├── config/          # Configuration management
├── controllers/     # Route controllers
├── services/        # Business logic
├── routes/          # API routes
├── middlewares/     # Express middlewares
├── validators/      # Input validation
├── types/           # TypeScript types
├── utils/           # Utility functions
├── lib/             # Shared libraries (JWT, password, etc.)
├── prisma/          # Database schema & migrations
└── server.ts        # Entry point
```

## Environment Variables

See `.env.example` for all required variables.

## Running the Project

```bash
# Install dependencies
npm install

# Setup database
cd backend
npx prisma migrate dev

# Start development
npm run dev

# Build for production
npm run build
```

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users (protected)
- `GET /api/users/:id` - Get user (protected)

## Development Workflow

1. Create feature branches
2. Make changes and test locally
3. Run linting and type checking
4. Commit with conventional commits
5. Create PR for review

## Security Considerations

1. Always use HTTPS in production
2. Keep dependencies updated
3. Rotate JWT secrets regularly
4. Monitor rate limits and adjust as needed
5. Implement proper logging and monitoring
6. Use environment variables for secrets
7. Implement request signing for sensitive operations
8. Add request validation on all endpoints

## Performance Optimization

- Database query optimization with Prisma
- Connection pooling for PostgreSQL
- Response caching where appropriate
- Gzip compression
- CDN for static assets (frontend)
- Rate limiting to prevent abuse
