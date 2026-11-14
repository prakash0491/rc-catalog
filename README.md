# RC Catalog

A production-oriented product catalog and storefront built with Next.js App Router. It combines a public catalog (search, filters, categories, wishlist, guest/customer cart) with a full admin CMS and Razorpay checkout.

## Stack

- Next.js 15 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS, custom UI primitives, Framer Motion, Lucide icons
- PostgreSQL + Prisma 6
- JWT sessions (`jose`) with separate admin and customer secrets/audiences
- bcrypt password hashing
- Razorpay orders, signature verification and webhook reconciliation
- Cloudinary image uploads
- Zod validation shared by API routes and forms
- Vitest + Testing Library

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Razorpay test keys (checkout) and Cloudinary credentials (admin image uploads) for the full experience

## Setup

```bash
npm ci
cp .env.example .env
# edit .env with your DATABASE_URL and secrets
npm run db:generate
npm run db:migrate     # or: npm run db:push for a throwaway database
npm run db:seed
npm run dev
```

Open http://localhost:3000. The admin CMS lives at http://localhost:3000/admin/login.

`npm run db:seed` is intentionally destructive for catalog content: it recreates categories, products, offers and business settings. It does not delete customers, orders or admins. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env` before seeding to create/update an admin account.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site URL used for metadata/links |
| `ADMIN_JWT_SECRET` | Yes in production | Signs admin sessions. Startup fails closed in production when missing/weak |
| `CUSTOMER_JWT_SECRET` | Yes in production | Signs customer sessions. Must differ from the admin secret |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | For uploads | Admin image upload endpoint |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | For checkout | Server-side Razorpay API calls |
| `RAZORPAY_WEBHOOK_SECRET` | For webhooks | Verifies `/api/checkout/webhook` signatures |
| `RAZORPAY_CURRENCY` | Optional | Order/checkout currency, default `INR` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Optional | Creates/updates an admin during `db:seed` |

Generate strong secrets with `openssl rand -base64 48` (or any cryptographically secure generator). Never reuse one secret for both audiences.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push schema without a migration (prototyping) |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply committed migrations (production) |
| `npm run db:seed` | Seed catalog data and the optional admin |

## Project layout

```
src/app                 Routes, layouts, API handlers, error/not-found boundaries
src/components          UI primitives, storefront sections, product/cart/admin widgets
src/lib                 Business logic: catalog, cart, orders, auth, CMS helpers
prisma/schema.prisma    Data model
prisma/migrations       SQL migrations
tests                   Vitest suites with mocked Prisma/session boundaries
```

Server-only modules start with `import 'server-only'`; API handlers return a consistent `{ success, data }` / `{ success, error: { message, code } }` envelope.

## Testing notes

The unit suite does not need a database, Razorpay keys or Cloudinary credentials. Prisma and session/cookie boundaries are mocked per suite, so tests exercise validation, pricing, cart merging, order finalization, webhook handling, JWT rules and route status mapping.

For end-to-end verification, point `DATABASE_URL` at a disposable PostgreSQL database, run `db:migrate` + `db:seed`, and use Razorpay test keys. Webhooks can be forwarded with `ngrok` or tested through Razorpay's dashboard.

## Operational notes

- Checkout only finalizes orders when the provider reports `captured`; amounts, currency and line snapshots are re-verified server-side.
- Order creation is idempotent: an open pending order is reused when the cart snapshot, total and currency still match.
- Catalog queries exclude drafts, soft-deleted products, inactive variants and inactive categories.
- Auth endpoints currently have no distributed rate limiting. Put them behind a WAF/edge limiter if exposed to untrusted traffic.
- In-memory fallbacks (for example public content) are best-effort; PostgreSQL is required for cart, orders, wishlist and admin features.
