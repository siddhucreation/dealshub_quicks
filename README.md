# Quicks website (customer + merchant)

Plain HTML/CSS/JS, no build step — works on any static host (Vercel, Netlify,
GitHub Pages, or your own server) and in every modern desktop/mobile browser.

```
quicks/
├── index.html          landing page (choose customer / merchant)
├── customer.html        signup, login, phone OTP, location picker, home feed
├── merchant.html         merchant signup/login + product & order dashboard
├── assets/
│   ├── style.css        shared design system (matches the DealsHub Quicks UI)
│   └── supabase-client.js   Supabase config + every auth/data helper function
└── README.md
```

## 1. Add your Supabase keys

Open `assets/supabase-client.js` and set:

```js
const SUPABASE_URL = "https://zkmlxlfgeensgrhudfqi.supabase.co"; // already filled in
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY_HERE";
```

Find the anon/public key under **Supabase → Project Settings → API →
Project API keys → `anon` `public`**. It's safe to ship in client-side code
(that's what Row Level Security is for — make sure RLS + grants are set on
every table, as you already worked out for the merchant app).

## 2. Match the table/column names to your schema

The helpers assume:

- `merchants` — `id` (= auth user id), `business_name`, `business_type`, `phone`, `email`, `address`
- `products` — `id`, `merchant_id`, `product_name`, `category`, `price`, `mrp`, `stock`, `is_available`
- `cart` — `user_id`, `product_id`, `quantity`
- `orders` — `id`, `merchant_id`, `customer_name`, `total`, `status`

If your actual columns differ (you mentioned earlier fixing mismatches like
`product_name` vs `name`, `is_available` vs `is_active`), just edit the
`TABLES` object and the field names inside `assets/supabase-client.js` —
every query goes through that one file.

## 3. Turn on Google sign-in

Supabase → **Authentication → Providers → Google** → enable it, add your
Google OAuth client ID/secret, and add these as authorized redirect URLs
(both here and in the Google Cloud Console):

```
https://<your-deployed-domain>/customer.html
https://<your-deployed-domain>/merchant.html
```

## 4. Turn on phone (OTP) sign-in

Supabase → **Authentication → Providers → Phone** → enable it and connect an
SMS provider (Twilio, MessageBird, or Vonage — Supabase needs one of these to
actually send the text). Without this step the "Continue with Phone" button
will show an error from Supabase when it tries to send the code.

## 5. Grants & RLS reminder

Since your tables were hand-written in SQL rather than made through the
Table Editor, double check `anon`/`authenticated` roles actually have
`SELECT`/`INSERT`/`UPDATE` grants and matching RLS policies — the same class
of 401 you already tracked down on the merchant app will happen here too if
a grant is missing. A good baseline:

```sql
grant select on products, merchants to anon, authenticated;
grant insert, update on products, orders, cart to authenticated;

alter table products enable row level security;
create policy "merchants manage own products" on products
  for all using (auth.uid() = merchant_id);
create policy "anyone can read available products" on products
  for select using (is_available = true);
```

(Adjust to your real policy needs — this is a starting point, not a full
security review.)

## 6. Deploy

Any static host works, e.g.:

```
npx vercel deploy .
```

or drag the `quicks` folder into Netlify's deploy UI. No environment
variables needed since the keys live in `supabase-client.js` (the anon key
is meant to be public).
