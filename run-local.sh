#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Prefer a compatible Node installation when an older system Node is first on PATH.
if [ -x /opt/homebrew/opt/node/bin/node ]; then
  export PATH="/opt/homebrew/opt/node/bin:$PATH"
fi
command -v php >/dev/null || { echo 'PHP 8.2+ is required.'; exit 1; }
command -v composer >/dev/null || { echo 'Composer is required.'; exit 1; }
command -v node >/dev/null || { echo 'Node 20.19+ is required.'; exit 1; }
node -e 'const v=process.versions.node.split(".").map(Number); if (v[0]<20 || (v[0]===20 && v[1]<19)) process.exit(1)' || { echo 'Node 20.19+ is required.'; exit 1; }

[ -f .env ] || cp .env.example .env
cd backend-laravel
if [ ! -f .env ]; then
  cp .env.example .env
  php -r '$p=".env"; $s=file_get_contents($p); $s=preg_replace("/^DB_CONNECTION=.*$/m", "DB_CONNECTION=sqlite", $s); $s=preg_replace("/^DB_DATABASE=.*$/m", "DB_DATABASE=".getcwd()."/database/database.sqlite", $s); file_put_contents($p,$s);'
fi
mkdir -p bootstrap/cache storage/framework/{sessions,views,cache/data} storage/logs storage/app/public
NEW_DATABASE=false
if [ ! -f database/database.sqlite ]; then
  touch database/database.sqlite
  NEW_DATABASE=true
fi
composer install --no-interaction --prefer-dist
if ! grep -q '^APP_KEY=base64:' .env; then php artisan key:generate; fi
php artisan migrate --force
if [ "$NEW_DATABASE" = true ]; then php artisan db:seed --force; fi

cd "$ROOT_DIR"
if [ ! -d node_modules ]; then npm install --no-package-lock; fi
php backend-laravel/artisan serve --host=127.0.0.1 --port=8000 &
BACKEND_PID=$!
trap 'kill "$BACKEND_PID" 2>/dev/null || true' EXIT INT TERM
npm run dev -- --host 127.0.0.1 --port 3000
