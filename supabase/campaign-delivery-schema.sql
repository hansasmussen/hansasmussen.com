create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('campaign-delivery', 'campaign-delivery', true)
on conflict (id) do nothing;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_name text,
  website text,
  contact_name text,
  contact_email text,
  primary_language text not null default 'da',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.brand_profiles (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  brand_description text not null default '',
  target_audience text not null default '',
  tone_of_voice text not null default '',
  preferred_words text[] not null default '{}',
  forbidden_words text[] not null default '{}',
  cta_style text not null default '',
  hashtag_style text not null default '',
  channels text[] not null default '{}',
  writing_examples text not null default '',
  anti_examples text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  description text not null default '',
  objective text not null default '',
  audience text not null default '',
  channels text[] not null default '{}',
  deliverables text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'in_review', 'ready', 'delivered')),
  start_date date,
  end_date date,
  hero_message text not null default '',
  social_post_plan jsonb not null default '[]'::jsonb,
  post_plan jsonb not null default '[]'::jsonb,
  newsletter_plan jsonb not null default '[]'::jsonb,
  asset_formats text[] not null default '{}',
  color_palette text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  kind text not null default 'asset',
  title text not null default '',
  notes text not null default '',
  product_names text[] not null default '{}',
  file_url text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.copy_variants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  channel text not null default 'Instagram Feed',
  variant_type text not null default 'social_caption',
  source_plan_id text,
  language text not null default 'da',
  headline text not null default '',
  body text not null default '',
  cta text not null default '',
  hashtags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.copy_variant_assets (
  copy_variant_id uuid not null references public.copy_variants(id) on delete cascade,
  asset_id uuid not null references public.campaign_assets(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (copy_variant_id, asset_id)
);

create index if not exists campaigns_customer_id_idx on public.campaigns(customer_id);
create index if not exists campaign_assets_campaign_id_idx on public.campaign_assets(campaign_id);
create index if not exists copy_variants_campaign_id_idx on public.copy_variants(campaign_id);
create index if not exists copy_variant_assets_asset_id_idx on public.copy_variant_assets(asset_id);

create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_brand_profiles_updated_at on public.brand_profiles;
create trigger set_brand_profiles_updated_at
before update on public.brand_profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.customers enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_assets enable row level security;
alter table public.copy_variants enable row level security;
alter table public.copy_variant_assets enable row level security;
