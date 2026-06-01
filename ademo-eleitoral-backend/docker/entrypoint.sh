#!/usr/bin/env sh
set -eu

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

php artisan storage:link >/dev/null 2>&1 || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
