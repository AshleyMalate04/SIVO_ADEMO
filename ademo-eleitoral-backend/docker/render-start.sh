#!/usr/bin/env sh
set -eu

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

php artisan package:discover --ansi || true
php artisan optimize:clear || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

php artisan migrate --force
php artisan queue:work --queue=mail,default --sleep=3 --tries=3 --timeout=60 &

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
