# AfriBiz Authentication System - Complete Setup Guide

## 📋 Project Overview

AfriBiz is a production-grade, multi-role African SaaS marketplace platform with enterprise authentication features inspired by Shopify's architecture and UX quality.

### Architecture Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS + Shadcn UI
- Framer Motion (animations)
- React Hook Form + Zod (form validation)
- Zustand (state management)
- React Query (data fetching)
- Axios (HTTP client)

**Backend:**
- Node.js + Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT (Access & Refresh tokens)
- Bcrypt (password hashing)
- Winston (logging)
- Nodemailer (email service)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or pnpm

### 1. Clone & Install Dependencies

```bash
cd afribiz
pnpm install
```

### 2. Environment Variables Setup

#### Backend (.env)

```bash
# .env file in backend/

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/afribiz"

# JWT Configuration
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-pass"
SMTP_FROM="noreply@afribiz.com"
SMTP_FROM_NAME="AfriBiz"

# Security
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME_MS=900000

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRES_IN_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Email Verification
EMAIL_VERIFICATION_EXPIRES_IN_HOURS=24
PASSWORD_RESET_EXPIRES_IN_HOURS=1

# Bcrypt
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

#### Frontend (.env.local)

```bash
# .env.local file in frontend/

NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 3. Database Setup

```bash
# Navigate to backend
cd backend

# Create PostgreSQL database
createdb afribiz

# Run Prisma migrations
pnpm run db:migrate

# (Optional) Seed database with test data
pnpm run db:seed
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Prisma Studio: http://localhost:5555 (after `pnpm run db:studio`)

## 🏗️ Project Structure

### Backend
```
backend/src/
├── config/          # Configuration files
├── controllers/      # Request handlers
├── services/        # Business logic
├── repositories/    # Database access layer
├── middlewares/     # Express middleware
├── routes/          # API routes
├── validators/      # Zod validation schemas
├── lib/             # Utilities (JWT, password, mail, logger)
├── prisma/          # Database schema & migrations
└── types/           # TypeScript interfaces
```

### Frontend
```
frontend/src/
├── app/             # Next.js App Router
│   ├── (auth)/      # Auth pages (login, signup, etc.)
│   ├── (dashboard)/ # Protected dashboard routes
│   ├── (public)/    # Public pages
│   └── layout.tsx   # Root layout
├── components/      # React components
│   ├── auth/        # Auth-specific components
│   └── providers.tsx # Global providers
├── stores/          # Zustand stores
├── services/        # API client & services
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## 🔐 Authentication Flow

### User Registration
1. User fills signup form (First Name, Last Name, Email, Phone, Password)
2. Password validated for strength (8+ chars, uppercase, lowercase, number, special char)
3. User automatically assigned CLIENT role
4. Email verification token generated (expires in 24 hours)
5. Verification email sent
6. User logged in with tokens (no email verification required to login)

### User Login
1. User enters email and password
2. System verifies credentials
3. Failed attempts tracked (max 5 before 15-minute lockout)
4. Successful login returns:
   - Access Token (15 minutes)
   - Refresh Token (7 days) - stored in HTTP-only cookie
5. Security log recorded with IP and device info

### Token Refresh (Token Rotation)
1. Client sends refresh token
2. Backend validates and checks if revoked
3. Issues new access token AND new refresh token
4. Old refresh token is revoked immediately
5. Ensures compromised tokens are limited in scope

### Role Activation
- New users start as CLIENT only
- Inside dashboard, users can activate:
  - BUSINESS role (for store owners, restaurants, service providers)
  - DEVELOPER role (for app developers)
- Multi-role support allows users to have multiple roles

## 📊 Database Schema

### Core Tables
- **User** - User accounts with role management
- **Session** - Active user sessions with device tracking
- **RefreshToken** - Refresh tokens with revocation support
- **PasswordReset** - Password reset tokens
- **EmailVerification** - Email verification tokens
- **OtpCode** - OTP codes for various purposes
- **SecurityLog** - Audit trail of user actions
- **Device** - Trusted devices for user accounts

## 🔒 Security Features

### Password Security
- Bcrypt hashing with configurable rounds (default 10)
- Strong password requirements enforced
- Password history tracking (prevent reuse)

### Account Protection
- Brute force detection (5 failed attempts = 15-min lockout)
- IP address logging
- Device tracking
- Security log audit trail
- Session management (revoke sessions)

### Token Security
- JWT access tokens (short-lived: 15 minutes)
- Refresh token rotation (new tokens on refresh)
- HTTP-only cookies for refresh tokens
- Token revocation support
- Secure token storage patterns

### Additional Security
- CORS protection
- Helmet.js for HTTP headers
- Rate limiting on auth endpoints
- CSRF protection ready (implement if needed)
- Email verification requirement
- OTP support for additional verification

## 📧 Email Templates

The system includes professional HTML email templates for:
1. **Welcome Email** - New account signup
2. **Email Verification** - Email confirmation
3. **Password Reset** - Password recovery link
4. **Login OTP** - One-time password for login
5. **Suspicious Login Alert** - New login notification

All templates are responsive and match AfriBiz brand (emerald green theme).

## 🎨 Frontend UI/UX

### Design Inspiration: Shopify
- Clean, minimal aesthetic
- Generous whitespace and padding
- Clear typography hierarchy
- Smooth transitions and animations
- Emerald green (#2D8A5B) primary color
- Accessible color contrast

### Layout Features
- **Split-panel design** for auth pages (45% promo / 55% form on desktop)
- **Auto-scrolling carousel** on promotional panel with:
  - Business statistics
  - Platform features
  - Testimonials
  - Success stories
  - Pricing information
- **Responsive design** that adapts to mobile/tablet
- **Dark mode ready** (can be implemented)

### Pages Implemented
- ✅ Home/Landing page
- ✅ Login page with password visibility toggle
- ✅ Signup page with validation
- ✅ Forgot password page
- ✅ Reset password page
- ✅ Email verification page
- ✅ Dashboard with role activation
- ✅ Profile/Settings page (ready to implement)

## 🚀 Advanced Features

### Implemented
- ✅ Email verification with custom tokens
- ✅ Forgot password flow
- ✅ OTP generation and verification
- ✅ Session management
- ✅ Multi-device login tracking
- ✅ Security audit logging
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting on sensitive endpoints
- ✅ Token refresh rotation
- ✅ Account lockout after failed attempts

### Ready to Implement
- Two-factor authentication (2FA)
- OAuth/Social login (Google, Facebook, Apple)
- Business onboarding wizard
- Developer dashboard with API key management
- Webhook support
- Admin dashboard
- User analytics
- Notification preferences

## 🧪 Testing

### API Endpoints to Test

```bash
# Signup
POST /api/auth/signup
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}

# Refresh Token
POST /api/auth/refresh
{
  "refreshToken": "your-refresh-token"
}

# Verify Email
POST /api/auth/verify-email
{
  "token": "verification-token-from-email"
}

# Send OTP
POST /api/auth/send-otp
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFICATION"
}

# Activate Business Role
POST /api/auth/activate-business
(requires: Authorization: Bearer access-token)
```

## 🔧 Configuration Examples

### Using Mailtrap for Development
1. Sign up at mailtrap.io
2. Create inbox and get credentials
3. Add to `.env`:
```
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-username
SMTP_PASS=your-password
```

### Production Deployment

For production, use a real email service:
- SendGrid
- AWS SES
- Mailgun
- Postmark

Update SMTP credentials accordingly.

## 📚 Key Files to Review

### Backend
- `src/services/auth.ts` - Core auth logic
- `src/repositories/*` - Database operations
- `src/middlewares/auth.ts` - JWT verification
- `backend/src/prisma/schema.prisma` - Database schema

### Frontend
- `src/stores/authStore.ts` - Auth state management
- `src/services/apiClient.ts` - API communication
- `src/components/auth/*` - Auth components
- `src/app/(auth)/*` - Auth pages

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql --version

# Check connection string in .env
# Format: postgresql://user:password@host:port/database
```

### Email Not Sending
```bash
# Check SMTP credentials in .env
# Enable "Less secure app access" if using Gmail
# Use Mailtrap for development instead
```

### Port Already in Use
```bash
# Backend (port 3001)
lsof -i :3001
kill -9 <PID>

# Frontend (port 3000)
lsof -i :3000
kill -9 <PID>
```

### Prisma Errors
```bash
# Regenerate Prisma client
pnpm run prisma generate

# Reset database (development only!)
pnpm run prisma migrate reset
```

## 📖 API Documentation

Full API documentation can be generated using Swagger/OpenAPI. To implement:

```bash
cd backend
npm install swagger-ui-express swagger-jsdoc
```

Then add Swagger setup in `src/server.ts`.

## 🚀 Performance Optimization

### Frontend
- ✅ Image optimization with Next.js Image
- ✅ Code splitting with dynamic imports
- ✅ API request caching with React Query
- ✅ Form state optimization with React Hook Form

### Backend
- ✅ Database indexing on frequently queried fields
- ✅ JWT token expiration to limit session duration
- ✅ Rate limiting to prevent abuse
- ✅ Connection pooling with Prisma

## 📞 Support

For issues, questions, or contributions, please:
1. Check existing issues on GitHub
2. Create a detailed issue with reproduction steps
3. Include error messages and system info

## 📄 License

MIT License - Feel free to use this project as a reference or foundation.

## 🎉 Next Steps

1. ✅ Complete the authentication system (DONE)
2. Implement email templates customization
3. Add analytics integration
4. Build admin dashboard
5. Create mobile app with React Native
6. Implement marketplace features
7. Add payment processing
8. Create developer API documentation

---

**Built with ❤️ for African Entrepreneurs**
