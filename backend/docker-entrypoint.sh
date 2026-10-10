#!/bin/sh
set -e

# Normalize APP_KEY if raw 44-character base64 string without base64: prefix
case "$APP_KEY" in
    base64:*) ;;
    *)
        if [ ${#APP_KEY} -eq 44 ]; then
            echo "[entrypoint] Auto-prefixing base64: to APP_KEY"
            export APP_KEY="base64:$APP_KEY"
        fi
        ;;
esac

# Sanitize database credentials by trimming trailing newlines and carriage returns
if [ -n "$DB_PASSWORD" ]; then
    DB_PASSWORD="$(printf '%s' "$DB_PASSWORD" | tr -d '\r\n')"
    export DB_PASSWORD
fi
if [ -n "$DB_HOST" ]; then
    DB_HOST="$(printf '%s' "$DB_HOST" | tr -d '\r\n')"
    export DB_HOST
fi
if [ -n "$DB_USERNAME" ]; then
    DB_USERNAME="$(printf '%s' "$DB_USERNAME" | tr -d '\r\n')"
    export DB_USERNAME
fi
if [ -n "$RESEND_API_KEY" ]; then
    RESEND_API_KEY="$(printf '%s' "$RESEND_API_KEY" | tr -d '\r\n ')"
    export RESEND_API_KEY
fi

# Support SSL CA certificate injection via environment variable
if [ -n "$MYSQL_SSL_CA_CONTENT" ]; then
    printf "%b\n" "$MYSQL_SSL_CA_CONTENT" > /var/www/html/storage/ca.pem
    chmod 644 /var/www/html/storage/ca.pem
    chown www-data:www-data /var/www/html/storage/ca.pem || true
    export MYSQL_ATTR_SSL_CA=/var/www/html/storage/ca.pem
fi

# If explicitly running artisan from CLI, skip web server setup
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

echo "[entrypoint] Migrations completed successfully."

# Start background queue worker inside the container (Processes ticket minting for free)
echo "[entrypoint] Starting embedded queue worker in background..."
php artisan queue:work --queue=default --sleep=3 --tries=3 --timeout=120 &

# Start lightweight cron loop inside the container (Runs scheduled tasks every minute for free)
echo "[entrypoint] Starting embedded cron scheduler loop in background..."
(while true; do php artisan schedule:run --no-interaction > /dev/null 2>&1; sleep 60; done) &

echo "[entrypoint] Starting Apache web server on port ${PORT}..."
exec "$@"
