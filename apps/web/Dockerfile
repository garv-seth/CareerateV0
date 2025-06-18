# Dockerfile for Web Service

# ---- Base ----
FROM node:18-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages packages

# Copy app-specific files
COPY apps/web/package.json apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/next.config.mjs apps/web/
COPY apps/web/postcss.config.js apps/web/

# Install dependencies
RUN pnpm install --filter web...

# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/web ./apps/web

# Copy source code
COPY apps/web/public ./apps/web/public
COPY apps/web/src ./apps/web/src

# Build the Next.js application
RUN pnpm --filter web build

# ---- Runner ----
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT 3000

CMD ["node", "apps/web/server.js"] 