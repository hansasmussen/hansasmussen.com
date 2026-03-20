alter table public.campaigns
add column if not exists social_post_plan jsonb not null default '[]'::jsonb;

alter table public.campaigns
add column if not exists post_plan jsonb not null default '[]'::jsonb;

alter table public.campaigns
add column if not exists newsletter_plan jsonb not null default '[]'::jsonb;

alter table public.campaigns
add column if not exists asset_formats text[] not null default '{}';

alter table public.campaigns
add column if not exists color_palette text[] not null default '{}';

alter table public.campaigns
add column if not exists delivery_packages jsonb not null default '[]'::jsonb;

alter table public.campaign_assets
add column if not exists product_names text[] not null default '{}';

alter table public.copy_variants
add column if not exists source_plan_id text;

create table if not exists public.copy_variant_assets (
  copy_variant_id uuid not null references public.copy_variants(id) on delete cascade,
  asset_id uuid not null references public.campaign_assets(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (copy_variant_id, asset_id)
);

create index if not exists copy_variant_assets_asset_id_idx on public.copy_variant_assets(asset_id);
