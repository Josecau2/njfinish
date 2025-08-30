# Build stage for frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Improve network reliability inside the builder
# - Ensure CA certificates exist (TLS)
# - Prefer IPv4 DNS resolution (often more reliable in DCs)
RUN apk add --no-cache ca-certificates && update-ca-certificates
ENV NODE_OPTIONS=--dns-result-order=ipv4first \
    npm_config_registry=https://registry.npmjs.org/ \
    npm_config_fetch_timeout=600000 \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) for building
# Use BuildKit cache mount to reuse the npm cache across builds
RUN --mount=type=cache,id=npm-cache,target=/root/.npm npm ci

# Copy source code
COPY . .

# Build frontend with optimizations
RUN npm run build:frontend

# Runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS=--dns-result-order=ipv4first \
    npm_config_registry=https://registry.npmjs.org/ \
    npm_config_fetch_timeout=600000 \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
# Prod-only deps; cache npm downloads across builds
RUN --mount=type=cache,id=npm-cache,target=/root/.npm npm ci --omit=dev
# copy your backend source from the build context (not the builder's node_modules)
COPY . .
# copy only the built frontend from the builder
COPY --from=builder /app/build ./build

# Ensure uploads and logs dirs exist and are writable
RUN mkdir -p /app/uploads /app/uploads/images /app/uploads/logos /app/uploads/manufacturer_catalogs /app/utils/logs && \
    chown -R node:node /app/uploads /app/utils/logs

USER node
EXPOSE 8080
CMD ["sh", "-lc", "node scripts/wait-for-db.js && node scripts/migrate.js up && node index.js"]
