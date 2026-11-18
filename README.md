# OMOOLA SUPERMARKET STORES

A multi-page React + Vite supermarket storefront with Supabase as the primary backend.

## Stack
- React 19, React Router, Tailwind CSS, Framer Motion, Lucide React
- Supabase Postgres, Auth, Storage and Row Level Security
- Vercel SPA routing via `vercel.json`

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Supabase project URL and publishable/anon key.
3. Run `npm install`, then `npm run dev`.
4. Run `npm run build` before deployment.

Never place a Supabase service-role key in frontend environment variables. The public key is safe to expose only with the project's RLS policies enabled.

## Routes
Public: `/`, `/shop`, `/product/:slug`, `/categories`, `/promotions`, `/cart`, `/checkout`, `/about`, `/contact`.
Admin: `/admin/login`, `/admin/dashboard`, `/admin/products`, `/admin/products/import`, `/admin/categories`, `/admin/orders`, `/admin/inventory`, `/admin/promotions`, `/admin/settings`.

## Admin access
Sign in with Supabase Auth. Access is granted only when the authenticated user has a row in `public.admin_profiles`. Admin roles and access are enforced by Supabase RLS; do not rely on client-side route protection alone.

## Ordering
Checkout writes customer, order and order-item records to Supabase. Orders begin as `pending`; opening WhatsApp is a separate handoff and does not confirm an order or deduct stock. Confirm stock availability before fulfilling an order.

## Product images
Uploads use the public `product-images` Supabase Storage bucket. Keep file upload permissions restricted to authorized administrators.

## Demo content
If the database has no active products or categories, the storefront displays clearly illustrative demo content so the UI can be previewed. Demo products cannot be ordered. Replace them by creating real products in the admin dashboard.
