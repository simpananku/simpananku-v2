# SIMPANANKU v2: local and production setup

The React frontend reads and writes through the Laravel API. Browser authentication uses a Laravel session cookie with CSRF protection. Frontend data is fetched from the database after login and after every write.

## Local backup installation

Requirements: PHP 8.2+, Composer 2, Node 20.19+ or 22+, SQLite extension. Run from the repository root:

```bash
./run-local.sh
```

The script creates ignored `.env` files, a local SQLite database, installs dependencies, migrates, seeds a fresh local database, and starts Laravel at `http://127.0.0.1:8000` and Vite at `http://127.0.0.1:3000`. It uses the Vite proxy, so `VITE_API_URL=/api/v1` and the session cookie stay on one browser host. Demo accounts from `backend-laravel/README.md` are for local testing only. Stop both services with Ctrl+C.

To restore an existing local backup, replace `backend-laravel/database/database.sqlite` while the app is stopped, then run `./run-local.sh`. Back up that file and the backend `.env` securely. Never commit either.

### Optional Docker Compose setup

The host must have Docker Compose available. Copy `.env.example` to `.env`, set `SIMPANANKU_DB_ROOT_PASSWORD`, `SIMPANANKU_DB_PASSWORD`, and a new `SIMPANANKU_APP_KEY` from `php artisan key:generate --show` (run inside `backend-laravel`). Then run `docker compose up -d --build` or `docker-compose up -d --build`, followed by `docker compose exec backend php artisan migrate --seed --force` (use the `docker-compose` form if that is your installed command). This is a local development stack; use the production hosting steps below for the live site.

## Production hosting

Use a hosting account or VPS with PHP 8.2+, Composer 2, MySQL 8/MariaDB 10.11, HTTPS, and writable `backend-laravel/storage` and `backend-laravel/bootstrap/cache`. Point the API site's document root to `backend-laravel/public`. Point the frontend site's document root to the built `dist` directory and configure an SPA fallback to `index.html`.

On the API host:

```bash
cd backend-laravel
cp .env.example .env
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan key:generate
```

Set these values in the **backend** `.env` before migration. Use real database credentials and a new strong initial admin password:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.simpananku.my.id
DB_CONNECTION=mysql
DB_HOST=YOUR_DB_HOST
DB_PORT=3306
DB_DATABASE=YOUR_DB_NAME
DB_USERNAME=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
SESSION_DRIVER=database
SESSION_DOMAIN=.simpananku.my.id
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=app.simpananku.my.id
CORS_ALLOWED_ORIGINS=https://app.simpananku.my.id
CACHE_STORE=file
QUEUE_CONNECTION=sync
INITIAL_ADMIN_EMAIL=YOUR_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD=YOUR_UNIQUE_12_PLUS_CHARACTER_PASSWORD
```

`APP_KEY` must be kept across releases; rotating it invalidates existing sessions. Use TLS for both subdomains. Do not use wildcard CORS origins or commit `.env`. The production seeder creates only the initial admin, never local demo users or financial data. Run it once when the database is empty:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
```

After the first seed, remove `INITIAL_ADMIN_PASSWORD` from `.env` and run `php artisan config:cache` again. For later releases, run `php artisan migrate --force` and refresh the caches. Keep a database backup before migrations. Configure the web server or hosting control panel to deny access to all Laravel files outside `public`.

Build the frontend with the production API URL baked into the Vite output:

```bash
cp .env.example .env
# Set VITE_API_URL=https://api.simpananku.my.id/api/v1 in .env
npm install --no-package-lock
npm run lint
npm run build
```

Deploy only `dist/` to the frontend web root. A frontend `.env` is build configuration, not a runtime secret. `GEMINI_API_KEY` belongs only in the backend `.env`; the AI features can be left unconfigured.

## Verification after deployment

1. Confirm `https://api.simpananku.my.id/up` returns 200 and the frontend loads over HTTPS.
2. Log in as the initial admin, refresh the page, and confirm the account remains signed in. Log out and confirm protected API requests return 401.
3. Create a Teller with a unique password and verify the Teller cannot access admin staff routes.
4. Create and edit a member or product, refresh and sign in from a second browser, and confirm the same database values appear.
5. Confirm a failed validation leaves the form open with an error and does not create a browser-only record.

Financial transactions that have succeeded cannot be deleted or have their amount changed through the admin edit form. The app preserves the original ledger entry; corrections require an explicit accounting workflow.
