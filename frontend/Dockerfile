FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/next.config.js frontend/tsconfig.json ./
COPY shared/package.json shared/ ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w shared && npm run build -w frontend

FROM base AS runner
RUN apk add --no-cache tini
WORKDIR /app/frontend
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/shared/dist /app/shared/dist
COPY --from=builder /app/shared/package.json /app/shared/
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
