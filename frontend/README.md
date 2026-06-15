# Frontend README

# AfriBiz Frontend

A modern, responsive SaaS frontend built with Next.js 15, TypeScript, and TailwindCSS.

## Features

- ✅ App Router with TypeScript
- ✅ Beautiful UI with Shadcn UI components
- ✅ State management with Zustand
- ✅ Data fetching with React Query
- ✅ Form handling with React Hook Form
- ✅ Input validation with Zod
- ✅ Smooth animations with Framer Motion
- ✅ Responsive design with TailwindCSS
- ✅ Absolute imports for clean code

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/                 # App Router pages
│   ├── (public)/       # Public routes
│   ├── (auth)/         # Auth routes
│   └── (dashboard)/    # Protected routes
├── components/         # Reusable UI components
│   ├── ui/            # Base components
│   └── common/        # Feature components
├── features/          # Feature-specific code
├── hooks/             # Custom React hooks
├── services/          # API clients
├── stores/            # Zustand stores
├── types/             # TypeScript types
├── utils/             # Utility functions
└── constants/         # App constants
```

## Available Scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm run start       # Start production build
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run type-check  # Check TypeScript
```

## Configuration

- **TailwindCSS**: See `tailwind.config.ts`
- **TypeScript**: See `tsconfig.json`
- **Next.js**: See `next.config.js`

## Environment Variables

See `.env.example` for available variables.

## Key Dependencies

- `next` - React framework
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `zustand` - State management
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `framer-motion` - Animations
- `tailwindcss` - Styling
- `shadcn/ui` - Component library

## Coding Standards

- TypeScript strict mode
- ESLint and Prettier configured
- Absolute imports with `@/*` paths
- Named exports preferred
- Functional components
- Hooks for state management

## Performance

- Image optimization
- Code splitting
- Font optimization
- CSS-in-JS optimization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

See `../docs/CONTRIBUTING.md`

## License

MIT
