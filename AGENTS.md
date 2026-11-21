# AGENTS.md

Instructions and orientation for AI agents (and humans) working in this repository.

This file describes **what the system is, how it is wired, and how to change it safely**.
Read it before editing code, running migrations, or deploying.

---

## 1. What this project is

`rc-catalog` is a Next.js 15 App Router storefront and admin CMS for an RC-toy catalogue.

It has two halves:

- **Public storefront** — catalogue browsing, search, categories, guest cart, PIN-code based
  delivery pricing, Razorpay test checkout, order confirmation.
- **Admin CMS** — cookie/JWT protected dashboard for products, categories, banners, offers,
  orders, inquiries and business settings, plus Cloudinary image uploads.

It is a **guest-first** storefront. Customer accounts still exist in the schema and code, but the
live storefront deliberately disables them (see §4.3). Do not re-enable them by accident.

### Live preview

| Target | URL | Status |
| --- | --- | --- |
| Vercel (current) | `https://rc-catalog-preview.vercel.app` | **Working** — production deployment |
| Cloudflare Workers (legacy) | `https://rc-catalog-preview.rc-catalog.workers.dev` | Blocked — see §8 |

Vercel project: `prakashs-projects-ac14c3f3/rc-catalog-preview`
(`projectId prj_AbyUifpnHe57yUHx1nPFxChOHeVA`). Production branch is `main`.

> The preview database and every preview credential are **temporary**. Create a fresh production
> database and rotate all secrets before going live. Never commit `.env*` files.

---

## 2. Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js `15.5.29` (App Router, Turbopack builds) |
| UI | React `19.1`, TypeScript 5, Tailwind CSS 3, Framer Motion, Lucide, custom primitives |
| Data | PostgreSQL + Prisma `6.19` |
| DB drivers | `@prisma/adapter-neon` for Neon hosts, `@prisma/adapter-pg` otherwise |
| Auth | `jose` (HS256 JWTs), separate admin/customer secrets + audiences, bcryptjs cost 12 |
| Payments | Razorpay **test mode only** (enforced in code) |
| Media | Cloudinary (server-side uploads; 5 MB, JPEG/PNG/WebP/GIF) |
| Validation | Zod 4, shared by API routes and forms |
| Tests | Vitest 4 + Testing Library (19 files, 223 tests) |
| Hosting | Vercel (primary) and OpenNext + Cloudflare Workers (secondary) |

---

## 3. Repository layout

```
src/app/                 Routes, layouts, API handlers, error boundaries
  (public)               /, /products, /products/[slug], /categories, /cart, /checkout,
                         /confirmation/[id], /about, /contact, /faq, /login, /register, /wishlist
  account/               Legacy customer area (server-side, but blocked by middleware)
  admin/(auth)/login     Admin sign-in page
  admin/(protected)/     Dashboard, products, categories, orders, offers, banner, inquiries, settings
  admin/api/             login, logout, dispatch (Porter booking reference)
  api/                   Public JSON API + checkout + Razorpay webhook
src/components/          ui primitives, layout, home sections, product, cart/checkout, admin widgets
src/lib/                 All business logic (catalog, cart, orders, auth, CMS, payments, delivery)
src/mock/                Fallback content used when the DB is unavailable
prisma/                  schema.prisma, seed.ts, migrations/
scripts/                 Catalog import tooling (Cloudinary + product creation)
tests/                   Vitest suites; Prisma/session boundaries are mocked
src/middleware.ts        Edge route protection + legacy API blocking
worker.mjs               Cloudflare Worker entry (OpenNext wrapper + DB scope + rate limits)
worker-rate-limit.mjs    Workers rate-limit bindings for login/checkout
wrangler.jsonc           Workers config (name, assets, rate limits, self-reference)
open-next.config.ts      OpenNext Cloudflare adapter config
```

### Request flow

```
Browser
  → src/middleware.ts (edge): blocks legacy APIs, protects /admin and /account
  → App Router page/route handler
  → src/lib/* service function
  → prisma proxy (per-request PrismaClient)
  → Neon / PostgreSQL
```

Every API handler returns one envelope shape:

```ts
{ success: true,  data: T }
{ success: false, error: { message: string, code: string } }
```

Helpers live in `src/lib/api-utils.ts`. Use them instead of ad-hoc JSON.

---

## 4. Architecture details

### 4.1 Database layer

`src/lib/prisma.ts` exports a `Proxy` that resolves a `PrismaClient` on first property access:

- Hostname ends in `.neon.tech` → `PrismaNeon` driver adapter (HTTP/WebSocket friendly).
- Otherwise → `PrismaPg` adapter (normal Node Postgres).
- On Cloudflare, `worker.mjs` creates a `globalThis.rcDatabaseScope` `AsyncLocalStorage` and runs
  each request inside it. The proxy stores the client in that scope, so **sockets never leak
  between requests** and streaming responses can disconnect the client after the body flushes.
- In plain Node/Vercel, the scope is absent and a single module-level client is reused.

Consequences for agents:

- Never import `PrismaClient` directly in app code; import `{ prisma }` from `@/lib/prisma`.
- Never hold a `prisma` client reference across requests on Workers.
- Run `npm run db:generate` after any `schema.prisma` change or dependency install, or TypeScript
  will report bogus Prisma type errors.

### 4.2 Data model (18 tables)

`Product`, `ProductImage`, `ProductSpecification`, `ProductVariant`, `Category`,
`Banner`, `Offer`, `Inquiry`, `BusinessSettings`, `Admin`, `Customer`, `WishlistItem`,
`Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`.

Key rules encoded in the schema:

- `Product` is soft-deleted (`deletedAt`) and gated by `status` (`DRAFT`/`PUBLISHED`) and
  `isActive`. Public queries must exclude drafts, soft-deleted rows and inactive categories.
- `OrderItem` stores **immutable commercial snapshots** (name, slug, SKU, image, price, quantity,
  line total), so historical orders survive product edits/deletes.
- `Order` supports either `customerId` or `guestSessionId`; `recipientName`, `mobile`, `address`,
  `pinCode`, `deliveryFee`, `porterBooking` were added by the guest-delivery migration.
- `Order.checkoutKey` is unique and makes order creation idempotent for the same cart snapshot.
- Enums: `ProductStatus`, `StockStatus`, `InquiryStatus`,
  `OrderStatus` (`PENDING_PAYMENT`, `PAID`, `PAYMENT_FAILED`, `CANCELLED`, `PROCESSING`, `SHIPPED`,
  `DELIVERED`, `REFUNDED`, `REFUND_REQUIRED`),
  `PaymentStatus` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).

### 4.3 Guest-first identity model

Cookies:

| Cookie | Purpose | TTL |
| --- | --- | --- |
| `rc_guest_session` | Guest cart/checkout identity (UUID) | 30 days |
| `rc_admin_session` | Admin JWT (audience `rc-admin`) | 7 days |
| `rc_customer_session` | Legacy customer JWT (audience `rc-customer`) | 7 days |

`src/middleware.ts` enforces the migration state:

- `/api/auth/*`, `/api/wishlist/*`, `/api/orders/*` → **`410 Gone`**.
- `/api/cart/*` → strips `rc_customer_session` before the handler runs (guest carts only).
- `/admin/*` → verifies the admin JWT; redirects to `/admin/login?next=…`.
- `/account/*` → verifies the customer JWT; redirects to `/login?next=…`.

So the customer pages and API routes still exist and compile, but are intentionally unreachable.
Treat that as a deliberate product decision, not dead code to "clean up".

### 4.4 Admin authentication

- `POST /admin/api/login` consumes **`application/x-www-form-urlencoded`** (not JSON) and answers
  with `303`: success → `Location: /admin`, failure → `/admin/login?error=invalid`.
- `src/lib/auth/admin.ts` looks up `Admin` by lowercased email and compares with bcryptjs.
- `src/lib/auth/jwt.ts` signs/verifies HS256 JWTs with `ADMIN_JWT_SECRET` and audience `rc-admin`.
- `src/lib/auth/session.ts` sets an `httpOnly`, `SameSite=Lax`, `Secure`-in-production cookie.
- `POST /admin/api/logout` clears it.
- If `ADMIN_JWT_SECRET` is missing in production, signing/verifying throws rather than using the
  dev fallback.

Admin UI lives in the route group `src/app/admin/(protected)/`; the group layout assumes an
authenticated session (middleware guarantees it for normal navigation).

### 4.5 Catalogue and content

- `src/lib/products.ts` — public catalogue queries (list, detail, related, featured, categories,
  search suggestions).
- `src/lib/products-api.ts` — server-side fetch helpers used by pages; they call the app's own
  `/api/products` endpoints using `NEXT_PUBLIC_SITE_URL`. **`NEXT_PUBLIC_SITE_URL` is inlined at
  build time**, so changing it requires a rebuild/redeploy.
- `src/lib/admin-products.ts` — admin CRUD, slug de-duplication, soft delete, duplicate, bulk
  publish/draft/delete. Admin forms are parsed with `adminProductFormSchema`.
- `src/lib/public-content.ts` — aggregates business settings, hero banner, offers, categories,
  FAQs and SEO in one cached call; falls back to `src/mock` data if the DB throws.
- `src/lib/delivery.ts` — reads `DELIVERY_FEES_PAISE`, a JSON object mapping PIN → fee in
  **integer paise**. Malformed JSON or an unknown PIN returns `null` (delivery unavailable).
- `src/lib/money.ts` — `Decimal`-to-number display helpers, `formatPrice`, `computeDiscountPercent`,
  and `toRazorpayAmount` (smallest currency unit).

### 4.6 Checkout and payments

Flow (guest):

1. `POST /api/cart/items` — creates `rc_guest_session` + cart if absent, adds the product.
2. `GET /api/checkout/quote?pin=560001` — returns `{ fee }` in paise, or `{ fee: null }`. Always
   HTTP 200 for a syntactically valid request.
3. `POST /api/checkout/create-order` — JSON body with **top-level** fields:
   `{ recipientName, mobile, address, pinCode }` (mobile must match `^[6-9][0-9]{9}$`).
   Responses:
   - `401 UNAUTHORIZED` — no guest session.
   - `400 INVALID_ADDRESS` — Zod validation failure.
   - `422 UNSUPPORTED_PIN` — PIN not in `DELIVERY_FEES_PAISE`.
   - `200` — `{ orderId, orderNumber, razorpayOrderId, keyId, amount (paise), currency }`.
   Order creation is idempotent via `checkoutKey`; an open pending order is reused when the cart
   snapshot and totals still match.
4. Browser opens Razorpay Checkout with the returned `keyId`/`razorpayOrderId`/`amount`.
5. Finalisation happens through **either** `POST /api/checkout/verify-payment` **or**
   `POST /api/webhooks/razorpay` (`payment.captured`). Both converge on `finalizePaidOrder`, which
   runs in a transaction and is idempotent:
   - `Payment` `PENDING`/`FAILED` → `PAID` (0 rows updated ⇒ already processed, returns early).
   - `Order` → `PAID`.
   - Stock decremented atomically with `stockQuantity >= quantity`; a failure throws
     `STOCK_CONFLICT`.
   - Purchased rows are removed from the cart without deleting items added after checkout began.
6. Admin fulfilment: `POST /admin/api/dispatch` accepts a Porter booking reference and moves
   `PAID` → `SHIPPED`.

Safety rules that must be preserved:

- `src/lib/razorpay.ts` **refuses live keys** (`RAZORPAY_KEY_ID` must start with `rzp_test_`).
- Webhook signatures are HMAC-SHA256 over the **raw body** with `RAZORPAY_WEBHOOK_SECRET`,
  compared with `timingSafeEqual`.
- Payment signatures are HMAC-SHA256 of `order_id|payment_id` with `RAZORPAY_KEY_SECRET`.
- If Razorpay captures an amount/currency that does not match the order, the payment is recorded
  as `PAID` and the order moves to `REFUND_REQUIRED` — **never** mark it failed and never
  auto-refund. Refunds happen manually in the Razorpay dashboard.
- Never log secrets, full card data, or the webhook raw body.

---

## 5. Environment variables

Copy `.env.example` → `.env.local` (or `.env`) and fill it in.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled runtime connection string |
| `DATABASE_URL_DIRECT` | Migrations only | Direct (non-pooler) host; not needed at runtime |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin; **inlined at build time** |
| `ADMIN_JWT_SECRET` | Yes in prod | Admin JWT signing key |
| `CUSTOMER_JWT_SECRET` | Yes in prod | Must differ from the admin key |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Checkout | Must be `rzp_test_*` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook | HMAC key for webhook verification |
| `RAZORPAY_CURRENCY` | Optional | Default `INR` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Uploads | Admin image uploads |
| `DELIVERY_FEES_PAISE` | Checkout | JSON, e.g. `{"560001":4900}` (paise) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seeding | Optional admin bootstrap |

Generate secrets with `openssl rand -base64 48` (or equivalent). Never reuse one secret for both
audiences.

`.gitignore` already excludes `.env*` (except `.env.example`), `.vercel`, `.wrangler`,
`.open-next`. Keep it that way.

---

## 6. Day-to-day workflow

### 6.1 First run

```bash
npm ci
cp .env.example .env.local          # fill values; on Windows: copy .env.example .env.local
npm run db:generate
npm run db:deploy                   # or `db:migrate` in development
npm run db:seed                     # destructive for catalogue content, not for orders/admins
npm run dev
```

Storefront: `http://localhost:3000` · Admin: `http://localhost:3000/admin/login`

### 6.2 Before every commit

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config)
npm test             # vitest run
```

All three are expected to pass. The suite needs **no** database, Razorpay keys or Cloudinary
credentials; it mocks Prisma and session/cookie boundaries.

### 6.3 Database changes

```bash
# 1. edit prisma/schema.prisma
npm run db:generate
npm run db:migrate -- --name describe_the_change   # dev: creates + applies SQL
npm run db:deploy                                  # prod/preview: applies committed migrations
```

Rules:

- Migrations must run against the **direct** host. For Neon, strip `-pooler.` from the hostname
  (or use `DATABASE_URL_DIRECT`). The runtime keeps using the pooled `DATABASE_URL`.
- The three existing migrations are ALTER-only (`202607300001_admin_cms_expansion`,
  `202611140001_refund_required`, `202611190001_guest_delivery`). There is **no baseline
  migration**, so a brand-new database is prepared with `prisma db push`, then
  `prisma migrate resolve --applied 202611190001_guest_delivery` so future `migrate deploy`
  works. Do not reintroduce a full-schema baseline without checking history.
- `prisma.config.ts` loads `dotenv/config` and uses `engine: "classic"`. `dotenv` is a real
  devDependency now; a fresh install must have it or Prisma CLI config resolution fails.
- `npm run db:seed` recreates categories, products, offers and business settings, but preserves
  customers, orders and admins.

### 6.4 Deploying to Vercel (current target)

The project is already linked (`.vercel/project.json`).

```bash
npx vercel@latest deploy --prod --yes
```

- Framework preset: Next.js · Node 26.x · build `npm run build` (= `next build --turbopack`).
- Set env vars with `vercel env add <NAME> production`; they must exist **before** the build
  because `NEXT_PUBLIC_SITE_URL` is baked in.
- `/api/checkout/quote`, products, admin, guest cart and signed webhooks are verified working on
  this target.
- Vercel does **not** run `worker.mjs` or the Workers rate-limit bindings; there is currently no
  distributed rate limiting on Vercel. Add one (e.g. Upstash) before exposing admin/checkout to
  hostile traffic.

### 6.5 Deploying to Cloudflare Workers (secondary target)

Only useful after the account is on Workers **Paid** (see §8).

```bash
# Never use bare `npx` here: it can block on an install prompt in non-interactive shells.
.\node_modules\.bin\opennextjs-cloudflare.cmd build
.\node_modules\.bin\wrangler.cmd deploy
```

- `wrangler.jsonc` binds `ASSETS`, `WORKER_SELF_REFERENCE`, `ADMIN_RATE_LIMIT` (5/min) and
  `CHECKOUT_RATE_LIMIT` (30/min).
- `worker.mjs` wraps the OpenNext output, applies rate limits, and scopes Prisma sockets per
  request; it re-exports Durable Object handlers from `.open-next/worker.js`.
- Secrets live in Cloudflare, not in the repo. `.env.preview` was uploaded with
  `wrangler secret bulk`; `DATABASE_URL_DIRECT` is intentionally not uploaded.
- Requires `next build` to emit standalone output, which OpenNext does when it drives the build
  itself — `--skipBuild` fails on a plain `next build`.

---

## 7. Conventions and guardrails

- **Server-only modules** start with `import 'server-only'`. Keep DB, JWT and payment code out of
  client components.
- **Validate at the boundary** with Zod; reuse the schema for forms where possible.
- **Money**: catalogue prices are `Decimal` rupees; Razorpay amounts and delivery fees are integer
  **paise**. Never mix them.
- **Order data is immutable history.** Change statuses/payments; do not rewrite order snapshots.
- **Idempotency is a requirement**, not a nicety: duplicate webhooks, repeated verify calls and
  double-clicks must not double-charge or double-decrement stock.
- **Time**: store UTC; format with `Intl` for display.
- **Errors**: map expected failures to `buildApiError(message, CODE)`; let unexpected errors
  surface as 500s.
- **Tests**: add/adjust suites in `tests/`; mock `@/lib/prisma` and session helpers rather than
  hitting a database. `tests/server-only.ts` is aliased to `server-only` by Vitest.
- **No secrets** in code, tests, commits, logs, screenshots or chat.

---

## 8. Known state, gotchas and next steps

1. **Cloudflare Free plan CPU wall.** On Workers Free, the request CPU ceiling is ~10 ms.
   `wrangler tail` showed `outcome: exceededCpu`, `cpuTime: 10` for `/`, `/products`,
   `/api/products`, `/login` and `/admin/login`; only the in-memory PIN lookup (~8 ms) survived.
   Static assets were fine. This is a plan limit, not a code bug. Either upgrade to Workers Paid
   or stay on Vercel.
2. **Preview data is demo data.** 32 published products are live; the 30 that had price `0` were
   backfilled to ₹1,499 with 25 units. Two products kept their original ₹100. Replace with real
   prices and stock before launch.
3. **Delivery fees are mocked.** `DELIVERY_FEES_PAISE` in the preview maps a handful of PINs
   (e.g. `560001` → `4900` paise). Everything else correctly returns "unavailable".
4. **Preview admin password is temporary.** Credentials are in the gitignored `.env.preview`
   (`PREVIEW_ADMIN_EMAIL` / `PREVIEW_ADMIN_PASSWORD`). That row was re-hashed at bcrypt cost 10
   during diagnosis, while the code default is 12 — rotate it and the secrets for production.
5. **Uncommitted changes.** At the time of writing, `package.json` and `package-lock.json` are
   modified (adds `dotenv`). Review and commit deliberately; nothing else is dirty.
6. **Legacy customer auth is intentionally disabled** by middleware (`410` on auth/wishlist/orders,
   customer cookie stripped from carts). Re-enabling it needs a product decision, not just a
   middleware edit.
7. **`structure.txt` is not documentation** — it contains an old shell error. Ignore or delete it.

### Production checklist

- [ ] Create a new production PostgreSQL/Neon project; run the schema + seed there.
- [ ] Rotate `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET`, Razorpay keys and webhook secret.
- [ ] Replace Razorpay test keys only through the explicit test-mode guard change.
- [ ] Set real `DELIVERY_FEES_PAISE` and real catalogue prices/stock.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain and redeploy (build-time inlining).
- [ ] Add distributed rate limiting on whichever host serves production.
- [ ] Configure the Razorpay webhook URL to `/api/webhooks/razorpay` and verify signatures.
- [ ] Back up orders before any destructive migration.

---

## 9. Command cheat sheet

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest once (`223` tests) |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Coverage report |
| `npm run db:generate` | Prisma client generation |
| `npm run db:push` | Push schema without a migration |
| `npm run db:migrate` | Create + apply a dev migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Seed catalogue + optional admin |
| `npx tsx scripts/import-assets.ts` | Import `/assets` images into the catalogue (needs Cloudinary + DB) |
| `npx vercel@latest deploy --prod --yes` | Deploy the preview to Vercel |
| `.\node_modules\.bin\opennextjs-cloudflare.cmd build` | Build for Cloudflare (Paid plan) |
| `.\node_modules\.bin\wrangler.cmd deploy` | Deploy the Worker |
| `.\node_modules\.bin\wrangler.cmd tail --format json` | Inspect Worker CPU/outcome (debugging) |

Windows note: use `npm.cmd` / `npx.cmd` in PowerShell 5.1, and prefer the local
`node_modules\.bin\*` wrappers over `npx` for long-running CLIs.
