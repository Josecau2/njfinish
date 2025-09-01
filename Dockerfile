# syntax=docker/dockerfile:1.4
# Build stage for frontend
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Optional proxy args (passed from docker-compose.yml or CLI)
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG NPM_REGISTRY_FALLBACK=https://registry.npmmirror.com

# Improve network reliability inside the builder
# - Ensure CA certificates exist (TLS)
# - Prefer IPv4 DNS resolution (often more reliable in DCs)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_OPTIONS=--dns-result-order=ipv4first \
    npm_config_registry=${NPM_REGISTRY} \
    npm_config_fetch_timeout=600000 \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    HTTP_PROXY=${HTTP_PROXY:-} \
    HTTPS_PROXY=${HTTPS_PROXY:-} \
    NO_PROXY=${NO_PROXY:-}

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) for building
# - Set npm proxy if provided
# - Prefer configured registry; fallback to mirror if ping fails
# - Use BuildKit cache mount to reuse the npm cache across builds
RUN --mount=type=cache,id=npm-cache,target=/root/.npm set -eux; \
        if [ -n "${HTTP_PROXY}" ]; then npm config set proxy "$HTTP_PROXY"; fi; \
        if [ -n "${HTTPS_PROXY}" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi; \
        npm config set registry "${NPM_REGISTRY}"; \
        (npm ping || npm config set registry "${NPM_REGISTRY_FALLBACK}"); \
            for i in 1 2 3; do \
                npm --version && node -v; \
                npm ci && break || (echo "npm ci failed, retry $i/3" && sleep 25); \
            done


# Copy source code
COPY frontend/package*.json ./frontend/
COPY frontend/vite.config.js ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY frontend/index.html ./frontend/
COPY vite.config.js* ./

# Build frontend with optimizations
RUN npm run build:frontend

# Runtime stage
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NODE_OPTIONS=--dns-result-order=ipv4first \
    npm_config_registry=${NPM_REGISTRY} \
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

# Copy only the backend source files we need (avoid COPY . .)
COPY controllers ./controllers
COPY models ./models
COPY routes ./routes
COPY config ./config
COPY middleware ./middleware
COPY utils ./utils
COPY scripts ./scripts
COPY migrations ./migrations
COPY seeders ./seeders
COPY *.js ./

# copy only the built frontend from the builder (Vite outputs to frontend/build)
COPY --from=builder /app/frontend/build ./frontend/build

# Ensure uploads and logs dirs exist and are writable
RUN mkdir -p /app/uploads /app/uploads/images /app/uploads/logos /app/uploads/manufacturer_catalogs /app/utils/logs && \
    chown -R node:node /app/uploads /app/utils/logs

USER node
EXPOSE 8080
CMD ["sh", "-lc", "node scripts/wait-for-db.js && node scripts/migrate.js up && node index.js"]
