# Together Diary — multi-stage Docker build for the Next.js app itself.
# Postgres and object storage (MinIO in prod, SeaweedFS in dev) are
# separate services — see docker-compose.prod.yml / docker-compose.dev.yml.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma Client's constructor throws if DATABASE_URL is unset at all, and
# Next's build briefly evaluates every route module (including lib/prisma.ts)
# to read its config exports — a syntactically-valid placeholder is enough;
# the real value comes from docker-compose.prod.yml's environment at runtime.
ARG DATABASE_URL="postgresql://user:password@localhost:5432/together_diary?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

# Fresh prod-only install (no devDependencies), run separately from the
# builder so node_modules/prisma's own internal relative paths/symlinks
# stay exactly as npm laid them out — cherry-picking individual files out
# of a standalone-pruned node_modules broke prisma CLI's asset lookups.
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3300

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3300

CMD ["npx", "next", "start", "-p", "3300"]
