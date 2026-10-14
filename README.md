# POOMPAVAI

Thanjavur Thalaiyatti Bommai storefront. React + Vite, Vercel serverless API (`api/[...path].js` → `server/`), Neon PostgreSQL via Prisma, Razorpay.

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill it in (a local Postgres is fine).
3. `npm run db:push` then `npm run db:seed` (creates the 4 products from `doll-img/` — **prices/sizes/stock are placeholders**).
4. `npm run assets` (regenerates `public/` from `temple-img/`, `hero-frame/`, `doll-img/`; sources are never modified).
5. Two terminals: `npm run dev:api` and `npm run dev` → http://localhost:5173
6. `node --env-file=.env scripts/smoke.mjs` runs the API end-to-end checks (local DB only).

## Deploy (Vercel)
Set every variable in `.env.example` in the Vercel project, run `npx prisma db push` against Neon once, then deploy.
Razorpay webhook URL: `https://<site>/api/razorpay/webhook` (events: `payment.captured`, `order.paid`, `payment.failed`).
Google: create an OAuth Web client, add the site origin, set `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`.

## Super Admin
Open `/admin`, sign in with Google. Access requires the verified Google email to equal `SUPER_ADMIN_EMAIL`; every `/api/admin/*` call re-checks this server-side (403 otherwise).
