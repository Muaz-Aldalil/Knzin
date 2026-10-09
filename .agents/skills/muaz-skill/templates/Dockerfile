# Build stage — runs as non-root, installs from lockfile only.
FROM node:20-alpine AS builder

# Run npm/pnpm as a non-root user from the start.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable \
    && chown -R appuser:appgroup /app \
    && pnpm install --frozen-lockfile --ignore-scripts

USER appuser
COPY --chown=appuser:appgroup . .
RUN npm run build

# Serve stage — non-root, minimal image, read-only FS.
FROM nginx:alpine
RUN adduser -D appuser \
    && touch /var/run/nginx.pid \
    && chown -R appuser:appuser /var/cache/nginx /var/run/nginx.pid /etc/nginx/conf.d

COPY --from=builder --chown=appuser:appuser /app/dist /usr/share/nginx/html
COPY --chown=appuser:appuser nginx.conf /etc/nginx/conf.d/default.conf

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
