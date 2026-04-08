# ── Build stage ──────────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Copy only what's needed at runtime
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/build ./build
COPY templates/ ./templates/

# Sandbox workspace for file operations
RUN mkdir -p /workspace && chown node:node /workspace

# Run as non-root
USER node

# Default env vars for deployed mode
ENV PORT=8080
ENV MCP_FILE_FORGE_ALLOWED_PATHS=/workspace
ENV MCP_FILE_FORGE_READ_ONLY=false

EXPOSE 8080

CMD ["node", "build/index.js"]
