# ───── Stage 1: Dependencies (cached unless package.json changes) ─────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for both shared and aria-ui
COPY shared/package*.json ./shared/
COPY aria-ui/package*.json ./aria-ui/

# Install shared dependencies with cache mount
WORKDIR /app/shared
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Install aria-ui dependencies with cache mount
WORKDIR /app/aria-ui
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# ───── Stage 2: Builder (only reruns when YOUR code changes) ─────
FROM node:20-alpine AS builder

# Declare build arguments
ARG ARIA_AGENT_BASE_URL
ARG ARIA_DESKTOP_VNC_URL

# Set environment variables for the build process
ENV ARIA_AGENT_BASE_URL=${ARIA_AGENT_BASE_URL}
ENV ARIA_DESKTOP_VNC_URL=${ARIA_DESKTOP_VNC_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/aria-ui/node_modules ./aria-ui/node_modules

# Copy source code
COPY shared/ ./shared/
COPY aria-ui/ ./aria-ui/

# Build shared package
WORKDIR /app/shared
RUN npm run build

# Build aria-ui
WORKDIR /app/aria-ui
RUN npm run build

# ───── Stage 3: Runner (tiny, fast final image) ─────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built artifacts and dependencies
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/aria-ui/.next ./aria-ui/.next
COPY --from=builder /app/aria-ui/public ./aria-ui/public
COPY --from=builder /app/aria-ui/package.json ./aria-ui/package.json
COPY --from=builder /app/aria-ui/server.ts ./aria-ui/server.ts
COPY --from=builder /app/aria-ui/.env* ./aria-ui/
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/aria-ui/node_modules ./aria-ui/node_modules

WORKDIR /app/aria-ui

EXPOSE 9992

# Use a simpler start command that doesn't rebuild shared
CMD ["node_modules/.bin/tsx", "server.ts"] 


