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
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tzdata && rm -rf /var/lib/apt/lists/* && ln -fs /usr/share/zoneinfo/UTC /etc/localtime && dpkg-reconfigure -f noninteractive tzdata
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
RUN set -eux; \
        if [ -n "${HTTP_PROXY}" ]; then npm config set proxy "$HTTP_PROXY"; fi; \
        if [ -n "${HTTPS_PROXY}" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi; \
        npm config set registry "${NPM_REGISTRY}"; \
        (npm ping || npm config set registry "${NPM_REGISTRY_FALLBACK}"); \
            for i in 1 2 3; do \
                npm --version && node -v; \
                npm ci --include=dev && break || (echo "npm ci failed, retry $i/3" && sleep 25); \
            done


# Copy frontend source (entire folder to support .js/.mjs/.ts configs)
# Copy frontend source (include public assets so customization JSON exists at build time)
COPY frontend/ ./frontend/

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

# Install system dependencies including Chromium for Puppeteer PDF generation
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        default-mysql-client \
        chromium \
        fonts-liberation \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libxss1 \
        libasound2 \
        tzdata \
    && rm -rf /var/lib/apt/lists/*

# Configure Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
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
COPY constants ./constants
COPY utils ./utils
COPY services ./services
COPY scripts ./scripts
COPY migrations ./migrations
# Include server-side utilities (branding middleware, generators, etc.)
COPY server ./server
# Include runtime brand assets served from /public/brand
COPY public ./public
 # Ensure brand directory exists early (before switching user) so later runtime write succeeds
RUN mkdir -p /app/public/brand
COPY *.js ./

# copy the built frontend from the builder (Vite outDir -> /app/frontend/build). App serves from /app/build
COPY --from=builder /app/frontend/build ./build
# Copy fonts from public to build so they're served correctly
COPY --from=builder /app/frontend/public/fonts ./build/fonts

# Ensure uploads/backups/logs exist and are writable by node user
# Avoid slow recursive chown of the whole /app; only chown the writable dirs
RUN mkdir -p \
    /app/uploads/images \
    /app/uploads/logos \
    /app/uploads/resources \
    /app/uploads/manufacturer_catalogs \
    /app/utils/logs \
    /app/backups \
    /app/public/brand && \
    chown -R node:node /app/uploads /app/backups /app/utils/logs /app/public/brand || true

# Environment hints for app runtime (explicit static dir)
ENV STATIC_DIR=/app/build TZ=UTC

# Basic container health check: ensure server responds and brand inline is present
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD node -e "const http=require('http');http.get({host:'127.0.0.1',port:8080,path:'/'},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{if(d.includes('window.__BRAND__'))process.exit(0);process.exit(1);});}).on('error',()=>process.exit(1));"

USER node
EXPOSE 8080
CMD ["sh", "-lc", "node scripts/wait-for-db.js && node create-safe-global-migration.js up && node scripts/verify-resources-schema.js && node index.js"]
