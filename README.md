# hansasmussen.com

Version 2 of the portfolio site.

This repo is now structured as a `Next.js` app so the project can move away from static HTML and local-only state over time.

## Current status

- App structure is set up for `Next.js`
- Existing portfolio prototype has been migrated into reusable components
- `localStorage` is still used for admin editing in this first repo version
- The next backend step is to replace the local storage layer with Supabase

## Planned stack

- `Next.js`
- `Supabase`
- `Vercel`

## Main directories

- `app/`
- `components/`
- `lib/`
- `public/assets/`

## Next step

Install dependencies and run the app locally:

```bash
npm install
npm run dev
```

## Supabase setup

The repo now includes a Supabase scaffold:

- [.env.example](/Users/hansasmussen/Documents/hansasmussen.com/.env.example)
- [lib/supabase/browser.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/supabase/browser.js)
- [lib/supabase/server.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/supabase/server.js)
- [lib/supabase/admin.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/supabase/admin.js)
- [supabase/schema.sql](/Users/hansasmussen/Documents/hansasmussen.com/supabase/schema.sql)

Current project URL:

- `https://hyqekounreejkuulyysx.supabase.co`

What you still need to add locally:

1. Copy `.env.example` to `.env.local`
2. Paste your `anon key`
3. Paste your `service role key`
4. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor
5. Restart `npm run dev` after adding new env vars

After that, the next migration step is to switch `lib/site-data.js` from `localStorage` reads/writes to Supabase queries.

## Storage

Uploads now target a public Supabase Storage bucket named `portfolio-images`.

That bucket is also created in:

- [supabase/schema.sql](/Users/hansasmussen/Documents/hansasmussen.com/supabase/schema.sql)
