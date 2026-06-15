FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/tsconfig.json ./
COPY shared/package.json shared/ ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY . .
RUN pnpm build --filter=@afribiz/shared --filter=@afribiz/backend
RUN cd backend && npx prisma generate

FROM base AS runner
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
RUN cd /app && pnpm prune --prod 2>/dev/null; npx prisma generate --schema=backend/prisma/schema.prisma
EXPOSE 3001
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy --schema=backend/prisma/schema.prisma; echo 'Migrations done'; node backend/dist/server.js"]
