# NOVA — E-commerce & Landing Page Builder

A clean, minimalist, European-style e-commerce and landing page builder platform with a fully separated Arabic RTL admin dashboard. Zero build step, zero dependencies — pure HTML/CSS/JS with a lightweight Node static server.

Products and their landing pages are stored in `data/products.json` and managed through a small JSON API (`/api/products`) served by the same Node server — create, edit, publish/hide and delete products from the admin and the storefront updates instantly.

## Quick start

```bash
npm start          # or: node server/server.js
```

Then open:

| URL           | Purpose                                          |
| ------------- | ------------------------------------------------ |
| `http://localhost:3000/`        | Public storefront (home / landing page) |
| `http://localhost:3000/product.html?id=1` | Per-product landing page |
| `http://localhost:3000/builder.html` | Landing page builder (compose & edit sections) |
| `http://localhost:3000/cart.html`     | Cart & checkout demo |
| `http://localhost:3000/admin`    | Admin dashboard (Arabic, full RTL) |

## Structure

```
project-nova/
├── server/
│   ├── server.js      # Static server + JSON API (/api/products) + /admin
│   ├── test.js        # Route smoke tests (node server/test.js)
│   └── validate.js    # Asset/ID reference checks (node server/validate.js)
├── data/
│   └── products.json  # Live product catalog + per-product landing content
├── public/            # Storefront
│   ├── index.html     # Home / landing page
│   ├── builder.html   # Page builder workspace
│   ├── product.html   # Per-product landing page (rendered by product.js)
│   ├── cart.html      # Cart page
│   └── assets/
│       ├── css/       # base.css (design tokens), store.css, product.css, builder.css, cart.css
│       └── js/        # store.js, product.js, builder.js, cart.js
└── admin/             # Admin dashboard (SPA, RTL Arabic)
    ├── index.html
    ├── product-editor.html  # Landing-page editor for one product
    └── assets/
        ├── css/       # admin.css, editor.css
        └── js/        # admin.js, editor.js
```

## API

| Method | Endpoint            | Description                                  |
| ------ | ------------------- | -------------------------------------------- |
| GET    | `/api/products`     | List all products (with landing content)     |
| GET    | `/api/products?id=N`| Get a single product                         |
| POST   | `/api/products`     | Create (no `id`) or update (with `id`) a product; generated `id` and a default landing page for new products |
| DELETE | `/api/products?id=N`| Delete a product                             |

## Features

### Storefront
- High-contrast minimalist hero, feature grid, product grid, showcase, testimonials, newsletter.
- Product catalog is served from `/api/products` (with a built-in fallback catalog), so products added in the admin appear in the storefront immediately.
- Cart page with quantity controls and order summary.
- Per-product landing page (`/product.html?id=<n>`): a clean European design with product media, rating, price, stock, quantity + buy button, feature list, shipping strip and related products.

### Product & landing-page management (`/admin#products`)
- **إضافة منتج** — a modal creates a product and automatically generates a ready landing page (image/visual, title, description, buy button) in the same European style.
- Per product row:
  - **توليد** — (re)generates a default landing page and opens the storefront preview.
  - **معاينة** — opens the landing page exactly as a customer sees it (`/product.html?id=N`, new tab).
  - **تعديل** — opens `/admin/product-editor.html?id=N`: edit name, price, sale price, badge, stock, color, description, features, headline, promo line, buy-button text/link, and a "معروض على المتجر" switch; live preview + save persists to `data/products.json`.
  - **نسخ** — copies the landing page link.
  - **حذف** — deletes the product (with confirmation).
- Products with `landing.active = false` are hidden from the storefront grid (direct links still resolve).
- Everything persists to `data/products.json` — no more `localStorage` edits.

### Landing page builder (`/builder.html`)
- Modular sections: Hero, Features, Products, Stats, Testimonials, CTA.
- Sidebar `NovaBuilder` API to add / reorder / remove / reset sections live.
- Preview canvas renders the composed page; state persists to `localStorage`.

### Admin dashboard (`/admin`)
- Fully separated SPA, Arabic and RTL (language `ar`, `dir="rtl"`).
- Clean white surfaces, soft gray containers, deep-blue (`#0a6cff`) accents.
- Sidebar: لوحة التحكم (Overview), الإحصائيات (Analytics), المنتجات (Products), الطلبات (Orders + badge counter), العملاء (Customers), الإعدادات (Settings).
- Overview metric cards: إجمالي الزوار، إجمالي الطلبات، إجمالي الإيرادات، معدل التحويل، متوسط قيمة الطلب، العملاء الجدد.
- Interactive map section with city markers and an interactive city list.
- Revenue line chart, donut (sales channels), visitors bar chart — all hand-drawn SVG (no chart library).
- Orders / Products / Customers tabs, search, filters; Settings panels (general, payments, shipping, storefront).
- Responsive; drawer sidebar and mobile nav on small screens.

## Tests

```bash
node server/test.js       # route smoke tests
node server/validate.js   # asset & DOM id reference checks
```

`node --check <file>` can be used to syntax-check any JS file.