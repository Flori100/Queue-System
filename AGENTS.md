# AGENTS.md

## Cursor Cloud specific instructions

This is a **Laravel 13** Queue Management System using PHP 8.3, SQLite, Blade/Tailwind/Alpine.js, and Vite.

### Quick reference

| Action | Command |
|--------|---------|
| Install PHP deps | `composer install` |
| Install JS deps | `npm install` |
| First-time setup | `cp .env.example .env && php artisan key:generate && touch database/database.sqlite && php artisan migrate --force` |
| Build frontend | `npm run build` |
| Dev server (all-in-one) | `composer dev` (runs artisan serve, queue worker, pail, and vite dev concurrently) |
| Dev server (simple) | `php artisan serve --host=0.0.0.0 --port=8000` |
| Run tests | `php artisan test` |
| Lint check | `./vendor/bin/pint --test` |
| Lint fix | `./vendor/bin/pint` |

### Non-obvious notes

- The database, cache, session, and queue all use **SQLite** (`database/database.sqlite`). No external services are needed.
- The `.env` file is not committed. On first setup, copy `.env.example` to `.env` and run `php artisan key:generate`.
- If `database/database.sqlite` doesn't exist, create it with `touch database/database.sqlite` before migrating.
- Tests use in-memory SQLite with `RefreshDatabase` — they do not touch the dev database.
- `./vendor/bin/pint --test` currently reports existing style issues in the repo (not introduced by agents). Run `./vendor/bin/pint` to auto-fix.
- The `composer dev` script uses `concurrently` (npm) and starts 4 processes: artisan serve, queue:listen, pail (log viewer), and vite dev. For simpler setups, `php artisan serve` alone is sufficient when assets are pre-built with `npm run build`.
- Roles in the system: `admin`, `staff`, `receptionist`, `customer`. New registrations default to `customer`.
