# Architecture Notes

## Current phase

This repo is now prepared as a `Next.js` version of the portfolio.

The current code still uses browser `localStorage` for admin editing, but the structure is now split so the next migration can replace only the data layer instead of the whole frontend.

## Current structure

- `app/`
  Route-based pages
- `components/`
  Shared UI and client behavior
- `lib/default-site-data.js`
  Default seed content
- `lib/site-data.js`
  Current local storage data layer
- `public/assets/`
  Portfolio imagery

## Backend migration target

Replace `lib/site-data.js` with:

- Supabase reads for public pages
- Supabase writes for admin
- Supabase Storage for images
- Supabase Auth for admin login

## Suggested data tables

### `portfolio_items`

- `id`
- `title`
- `year`
- `image_url`
- `alt`
- `sort_order`
- `span`
- `focus`
- `is_analog`
- `is_featured`
- `created_at`
- `updated_at`

### `site_content`

- `id`
- `home_manifesto`
- `work_manifesto`
- `contact_paragraph_one`
- `contact_paragraph_two`
- `contact_paragraph_three`
- `contact_paragraph_four`
- `updated_at`

## Suggested next milestone

1. Install dependencies
2. Run the app locally
3. Replace the local storage layer with Supabase
4. Add image upload to Supabase Storage
5. Add admin auth

## Supabase project

- URL: `https://hyqekounreejkuulyysx.supabase.co`

## Files added for Supabase

- [lib/supabase/browser.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/supabase/browser.js)
- [lib/supabase/server.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/supabase/server.js)
- [lib/supabase/admin.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/supabase/admin.js)
- [supabase/schema.sql](/Users/hansasmussen/Documents/hansasmussen.com/supabase/schema.sql)

## Immediate next step

1. Add the Supabase keys to `.env.local`
2. Run the schema in the Supabase SQL editor
3. Replace the current `localStorage` implementation in [lib/site-data.js](/Users/hansasmussen/Documents/hansasmussen.com/lib/site-data.js)

## Storage upload flow

- Browser sends file to [app/api/upload/route.js](/Users/hansasmussen/Documents/hansasmussen.com/app/api/upload/route.js)
- Route uploads with service role credentials
- Supabase returns a public image URL
- Admin saves that URL into `portfolio_items.image_url`
