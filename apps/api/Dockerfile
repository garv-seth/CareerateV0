# Dockerfile for API Service

# ---- Base ----
FROM node:18-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages packages

# Copy app-specific files
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/

# Install dependencies for the entire workspace, focusing on the API
# This ensures that shared packages are available and built if necessary
RUN pnpm install --filter api...

# Build the API
COPY apps/api/src/ apps/api/src
RUN pnpm --filter api build

# ---- Prune Dev Dependencies ----
FROM builder AS pruner
WORKDIR /app
RUN pnpm prune --prod

# ---- Runner ----
FROM node:18-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy necessary files from the pruner stage
COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/apps/api/dist ./dist
COPY --from=pruner /app/apps/api/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/index.js"] 