# AfriBiz - Enterprise African SaaS Platform

A scalable, modular, enterprise-grade SaaS platform built for African markets. Supporting multiple user roles (Clients, Businesses, Developers, Admins) with marketplace, escrow, payments, and analytics capabilities.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Next.js 15 (App Router) with TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js with TypeScript, PostgreSQL, Prisma ORM
- **Shared**: Shared TypeScript types and contracts
- **Docs**: Architecture and API documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

### Installation

```bash
# Clone and install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Update .env.local with your configuration
```

### Development

```bash
# Start all services in development mode
npm run dev

# Frontend runs on http://localhost:3000
# Backend runs on http://localhost:3001
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## 📁 Project Structure

```
afribiz/
├── frontend/                 # Next.js SaaS frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature-specific components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API clients
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   └── constants/       # App constants
│   └── package.json
│
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── validators/      # Input validators
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   ├── prisma/          # Prisma schema & migrations
│   │   └── server.ts        # Server entry point
│   └── package.json
│
├── shared/                   # Shared types & utilities
│   ├── src/
│   │   ├── types/
│   │   ├── constants/
│   │   └── utils/
│   └── package.json
│
└── docs/                     # Documentation
```

## 🎨 Design System

- **Primary Color**: Emerald (#2D8A5B)
- **Aesthetic**: Clean, modern SaaS with African fintech feel
- **Inspiration**: Shopify-like cleanliness + premium feel

## 🔐 Security Features

- JWT-based authentication
- Refresh token system
- Role-based access control (RBAC)
- Helmet.js security headers
- CORS protection
- Rate limiting
- Input validation & sanitization
- Password hashing with bcrypt

## 📚 Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS
- Shadcn UI
- Framer Motion
- Zustand (state management)
- React Query (data fetching)
- React Hook Form
- Zod (validation)
- Axios

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT
- Bcrypt
- Helmet
- CORS
- Multer (file uploads)
- Nodemailer

### Development
- ESLint
- Prettier
- Husky
- TypeScript

## 🔄 Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Format code: `npm run format`
4. Lint and type-check: `npm run lint && npm run type-check`
5. Commit with conventional commits
6. Push and create PR

## 📖 Documentation

See `/docs` folder for:
- API documentation
- Database schema
- Architecture decisions
- Setup guides

## 🤝 Contributing

Follow the coding standards and conventions defined in this project. Ensure all code is properly typed and tested.

## 📄 License

MIT
