# Build stage for frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev) for building
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# Copy source code
COPY . .

# Build frontend with optimizations
RUN npm run build:frontend

# Runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm ci --omit=dev
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
