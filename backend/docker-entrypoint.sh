#!/bin/sh
set -e

# Support SSL CA certificate injection via environment variable
if [ -n "$MYSQL_SSL_CA_CONTENT" ]; then
    echo "$MYSQL_SSL_CA_CONTENT" > /var/www/html/storage/ca.pem
    chmod 644 /var/www/html/storage/ca.pem
    export MYSQL_ATTR_SSL_CA=/var/www/html/storage/ca.pem
fi

# If running background worker or cron, skip web server setup and migrations
if [ "$1" = "php" ] && [ "$2" = "artisan" ]; then
    php artisan config:cache || true
    exec "$@"
fi

# Configure Apache listening port (Render dynamically injects $PORT)
PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Cache configurations for production performance
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Run database migrations with retry loop for cold-start database resilience
echo "[entrypoint] Verifying database connectivity and executing migrations..."
attempt=0
max_attempts=10
until php artisan migrate --force --no-interaction; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge "$max_attempts" ]; then
        echo "[entrypoint] ERROR: Migrations failed after ${attempt} attempts." >&2
        exit 1
    fi
    echo "[entrypoint] Database not ready yet. Retrying (${attempt}/${max_attempts}) in 3s..."
    sleep 3
done

echo "[entrypoint] Migrations completed. Starting Apache web server on port ${PORT}..."
exec "$@"
