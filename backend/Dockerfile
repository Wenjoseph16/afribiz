FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/tsconfig.json ./
COPY shared/package.json shared/ ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w shared && npm run build -w backend
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
RUN cd /app && npm prune --production 2>/dev/null; npx prisma generate --schema=backend/prisma/schema.prisma
EXPOSE 3001
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy --schema=backend/prisma/schema.prisma; echo 'Migrations done'; node backend/dist/server.js"]
