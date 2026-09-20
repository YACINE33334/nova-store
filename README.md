# NOVA — E-commerce & Landing Page Builder

A clean, minimalist, European-style e-commerce and landing page builder with a fully separated **Arabic RTL** admin dashboard. Pure HTML/CSS/JS frontend (no build step) served by a lightweight Node backend.

The backend is the only thing that touches the database, and the database layer is **portable**: point `DATABASE_URL` at PostgreSQL (Supabase, Neon, RDS, VPS…) and everything runs on it; leave it empty and it falls back to the built-in JSON-file backend.

```
Storefront / Admin  →  Backend API (Node, :3200)  →  Database Layer  →  PostgreSQL / Supabase
```

## Features

- **Storefront** — hero, feature grid, product grid, showcase, testimonials, newsletter; product catalog served live from the API.
- **Per-product landing pages** (`/product.html?id=N`) — media, rating, price, stock, quantity + buy button, features, shipping strip, related products.
- **Landing page builder** (`/builder.html`) — compose heart/feature/stats/testimonial/CTA sections live.
- **Admin dashboard** (`/admin`, Arabic RTL) — products, orders, customers, settings, analytics; order status management; checkout translations (`/api/i18n`).
- **Images live inside the database** — `/api/upload` embeds images as base64 data-URLs into the product JSON stored in PostgreSQL. Nothing is written to the server disk, so media survives any environment.
- **Portable DB layer** — schema migrations, seeding and backup/export tooling for PostgreSQL; identical JSON fallback.

## Quick start (local)

```bash
npm install
# optional: copy the Supabase/Postgres connection string into .env
#   DATABASE_URL=postgresql://user:pass@host:5432/postgres?sslmode=require
npm run db:migrate      # create schema (only when using PostgreSQL)
npm run db:seed         # import local data/ files into the database
npm start               # node server/server.js  (port 3200, or $PORT)
```

Open:

| URL | Purpose |
| --- | --- |
| `http://localhost:3200/` | Public storefront |
| `http://localhost:3200/product.html?id=1` | Per-product landing page |
| `http://localhost:3200/admin/login` | Admin login (setup creates the account once) |
| `http://localhost:3200/healthz` | Health probe (`{"ok":true,"db":"postgres"}`) |

## Deployment (Render)

This repo ships a [render.yaml](./render.yaml) blueprint — in Render: **New + → Blueprint → `nova-store`**, set the `DATABASE_URL` environment variable (secret) to your Supabase pooler URL, deploy. Health check path: `/healthz`. Custom domains are supported from the Render service settings.

> The public instance sleeps after 15 minutes of inactivity on the free plan (first visit after sleep takes ~1 min).

## Structure

```
├── server/
│   ├── server.js          # HTTP server: static assets + JSON API + auth sessions
│   ├── db/
│   │   ├── index.js       # DB layer: env loading + backend selection
│   │   ├── json.js        # JSON-file backend (fallback)
│   │   ├── postgres.js    # PostgreSQL adapter (pg, jsonb document columns)
│   │   ├── migrations/0001_init.sql
│   │   ├── migrate.js     # npm run db:migrate
│   │   ├── seed.js        # npm run db:seed  (import data/*.json)
│   │   └── backup.js      # npm run db:backup / db:export (JSON + SQL dump)
│   ├── test.js            # route smoke tests
│   └── validate.js        # asset & DOM id reference checks
├── public/                # Storefront (HTML/CSS/JS)
├── admin/                 # Admin dashboard (Arabic RTL SPA)
├── data/                  # Seed source files (not committed; store data lives in the DB)
└── render.yaml            # Render blueprint
```

## API (same-origin JSON)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/products` | List products (or `?id=N` single) |
| POST | `/api/products` | Create / update (auth) |
| DELETE | `/api/products?id=N` | Delete (auth) |
| GET/POST | `/api/orders` | Order list (auth) / draft & submit from checkout |
| PUT | `/api/orders` | Batch status updates (auth) |
| POST | `/api/upload` | Image → base64 data-URL stored in the DB (auth) |
| GET/POST | `/api/settings`, `/api/i18n` | Store settings / checkout translations (write = auth) |
| POST | `/api/auth/setup` · `/api/auth/login` · `/api/auth/logout` | Admin auth (sessions via HTTP-only cookie) |
| GET | `/api/auth/status` · `/api/auth/me` | Session state |
| GET | `/healthz` | Health probe for hosting platforms |

## Database scripts

```bash
npm run db:migrate   # apply migrations (PostgreSQL)
npm run db:seed      # seed from data/*.json if missing
npm run db:backup    # snapshot to data/backups (JSON + portable SQL)
npm run db:export    # same, into ./data/backups
```

## Tests

```bash
node server/test.js
node server/validate.js
node --check <file>
```