# Build stage for frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install all dependencies (frontend + backend)
RUN npm ci --include=dev

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
COPY --from=builder /app .

# Ensure uploads and logs dirs exist and are writable
RUN mkdir -p /app/uploads /app/uploads/images /app/uploads/logos /app/uploads/manufacturer_catalogs /app/utils/logs && \
    chown -R node:node /app/uploads /app/utils/logs

USER node
EXPOSE 8080
CMD ["sh", "-lc", "node scripts/wait-for-db.js && node scripts/migrate.js up && node index.js"]
