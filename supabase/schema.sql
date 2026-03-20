create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  home_manifesto text not null default '',
  work_manifesto text not null default '',
  contact_paragraph_one text not null default '',
  contact_paragraph_two text not null default '',
  contact_paragraph_three text not null default '',
  contact_paragraph_four text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year text not null default '',
  image_url text not null,
  storage_path text,
  alt text not null default '',
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  project_slug text,
  journal_slug text,
  sort_order integer not null default 0,
  span text not null default 'single' check (span in ('single', 'wide')),
  focus text not null default 'center' check (focus in ('left', 'center', 'right')),
  is_analog boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_pages (
  slug text primary key,
  title text not null,
  summary text not null default '',
  technical_details text not null default '',
  body text not null default '',
  journal_slug text,
  media_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.journal_posts (
  slug text primary key,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  related_project_slug text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.portfolio_items
add column if not exists storage_path text;

alter table public.portfolio_items
add column if not exists media_type text not null default 'image';

alter table public.portfolio_items
add column if not exists project_slug text;

alter table public.portfolio_items
add column if not exists journal_slug text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();

drop trigger if exists set_portfolio_items_updated_at on public.portfolio_items;
create trigger set_portfolio_items_updated_at
before update on public.portfolio_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_project_pages_updated_at on public.project_pages;
create trigger set_project_pages_updated_at
before update on public.project_pages
for each row
execute function public.set_updated_at();

drop trigger if exists set_journal_posts_updated_at on public.journal_posts;
create trigger set_journal_posts_updated_at
before update on public.journal_posts
for each row
execute function public.set_updated_at();

insert into public.site_content (
  home_manifesto,
  work_manifesto,
  contact_paragraph_one,
  contact_paragraph_two,
  contact_paragraph_three,
  contact_paragraph_four
)
select
  'A modern-day drifter, chasing photons like they owe rent — Dust on the lens, a roll of film on the ready. Out here, it’s light and motion. A filmic fever dream with digital echoes. Every click a whispered prayer to the gods of grain. Whether it’s celluloid or silicon, the chase stays the same: you, the light, and the beautiful mess in between.',
  'The frame slows things down. A glance lingers, becomes something more. A bent sign, a flicker of symmetry, two strangers sharing a silent moment. The unnoticed comes into focus — Quiet tension. There’s a logic to the disorder, If you’re patient, it appears… then it’s gone.',
  'Let''s not make it complicated.',
  'I''m a fashion and lifestyle photographer based in Denmark, working across Europe chasing light, strong ideas, and honest visuals. I''m also part owner of PS Content, a full-service content production agency.',
  'Whether it''s a campaign, a concept, or something in-between, you''re welcome to get in touch directly through this portfolio or contact my booking manager, Amalie Danscher Asmussen.',
  'If it feels right, it probably is. Say something.'
where not exists (
  select 1 from public.site_content
);

insert into public.portfolio_items (title, year, image_url, storage_path, alt, media_type, project_slug, journal_slug, sort_order, span, focus, is_analog, is_featured)
select * from (
  values
    ('BW Portrait', '2025', '/assets/test-set/bw-portrait.jpg', null, 'Sort-hvid portrait', 'image', 'bw-portrait', null, 0, 'single', 'center', false, false),
    ('Nielsen''s Herre', '2025', '/assets/test-set/nielsens-herre.jpg', null, 'Portrait fra Nielsen''s herreserie', 'image', 'nielsens-series', null, 1, 'single', 'center', false, false),
    ('AW 2613082', '2025', '/assets/test-set/aw2613082.jpg', null, 'Bredt editorial billede', 'image', 'aw-2613082', 'aw-2613082-light-notes', 2, 'wide', 'center', false, true),
    ('Portrait 07494', '2025', '/assets/test-set/portrait-07494.jpg', null, 'Langt portrait i hojformat', 'image', 'bw-portrait', null, 3, 'single', 'center', false, false),
    ('Nielsen''s Dame', '2025', '/assets/test-set/nielsens-dame.jpg', null, 'Portrait fra Nielsen''s dameserie', 'image', 'nielsens-series', null, 4, 'single', 'center', false, true),
    ('Simply 43635', '2025', '/assets/test-set/simply43635.jpg', null, 'Portrait i hojformat', 'image', 'simply-43635', null, 5, 'single', 'center', false, true),
    ('Perfect Jeans', '2025', '/assets/test-set/perfectjeans.jpg', null, 'Bredt campaign billede', 'image', 'perfect-jeans', null, 6, 'wide', 'center', false, true),
    ('Numph HS', '2025', '/assets/test-set/numph-hs.jpg', null, 'Portrait fra Numph serie', 'image', 'numph-high-summer', null, 7, 'single', 'center', false, false),
    ('Gossia Lookbook', '2025', '/assets/test-set/gossia-lookbook.jpg', null, 'Portrait fra lookbook', 'image', 'gossia-lookbook', null, 8, 'single', 'center', false, false),
    ('NMPH Summer', '2025', '/assets/test-set/nmph-summer.jpg', null, 'Bredt sommerbillede', 'image', 'numph-high-summer', null, 9, 'wide', 'center', false, false)
) as seed(title, year, image_url, storage_path, alt, media_type, project_slug, journal_slug, sort_order, span, focus, is_analog, is_featured)
where not exists (
  select 1 from public.portfolio_items
);

insert into public.portfolio_items (title, year, image_url, storage_path, alt, media_type, project_slug, journal_slug, sort_order, span, focus, is_analog, is_featured)
select
  'Kenneth Kaalund Motion',
  '2025',
  '/assets/test-set/kennethkaalund.mp4',
  null,
  'Motion portrait video',
  'video',
  'kenneth-kaalund-motion',
  'kenneth-kaalund-motion-notes',
  10,
  'single',
  'center',
  false,
  false
where not exists (
  select 1 from public.portfolio_items where title = 'Kenneth Kaalund Motion'
);

insert into public.project_pages (slug, title, summary, technical_details, body, journal_slug, media_items)
select
  'aw-2613082',
  'AW 2613082',
  'Cold editorial light with a calm frame and a little distance.',
  'Camera: Leica SL2-S\nLens: 50mm\nLight: Natural window light\nFormat: Digital',
  'A restrained editorial series built around space, quiet styling and a cool tonal palette. The idea was to keep the frame clean enough that posture and expression did most of the work.',
  'aw-2613082-light-notes',
  '[
    {"src":"/assets/test-set/aw2613082.jpg","alt":"AW 2613082 hero","mediaType":"image","span":"wide"},
    {"src":"/assets/test-set/aw2614371.jpg","alt":"AW 2614371 portrait","mediaType":"image"},
    {"src":"/assets/test-set/portrait-07494.jpg","alt":"Portrait detail","mediaType":"image"}
  ]'::jsonb
where not exists (
  select 1 from public.project_pages where slug = 'aw-2613082'
);

insert into public.project_pages (slug, title, summary, technical_details, body, journal_slug, media_items)
select
  'nielsens-series',
  'Nielsen''s Series',
  'Two portraits from the same visual family, held together by tone and pace.',
  'Camera: Sony A7R IV\nLens: 85mm\nLight: Soft daylight + negative fill',
  'A portrait-led fashion series where the intention was to keep the styling readable while letting expression carry the frame. The edit stays gentle and slightly understated.',
  null,
  '[
    {"src":"/assets/test-set/nielsens-herre.jpg","alt":"Nielsen''s Herre","mediaType":"image"},
    {"src":"/assets/test-set/nielsens-dame.jpg","alt":"Nielsen''s Dame","mediaType":"image"}
  ]'::jsonb
where not exists (
  select 1 from public.project_pages where slug = 'nielsens-series'
);

insert into public.project_pages (slug, title, summary, technical_details, body, journal_slug, media_items)
select
  'kenneth-kaalund-motion',
  'Kenneth Kaalund Motion',
  'A moving portrait study where stillness and motion sit in the same frame.',
  'Camera: Sony FX3\nLens: 35mm\nLight: Available light\nSound: Off by default',
  'This project mixes still photographic framing with subtle motion. The intention was to let the clip behave like an image first, and only then reveal that it moves.',
  'kenneth-kaalund-motion-notes',
  '[
    {"src":"/assets/test-set/kennethkaalund.mp4","alt":"Kenneth Kaalund motion portrait","mediaType":"video"},
    {"src":"/assets/test-set/bw-portrait.jpg","alt":"Black and white companion portrait","mediaType":"image"}
  ]'::jsonb
where not exists (
  select 1 from public.project_pages where slug = 'kenneth-kaalund-motion'
);

insert into public.journal_posts (slug, title, excerpt, body, related_project_slug)
select
  'aw-2613082-light-notes',
  'How AW 2613082 Was Lit',
  'A quiet setup where the window did most of the talking.',
  'The frame was built around restraint. Instead of adding more light, the setup used one existing window and then shaped contrast by taking light away. That gave the skin enough texture and kept the styling from looking over-polished. The final image works because the setup stayed simple long enough for the subject to settle into it.',
  'aw-2613082'
where not exists (
  select 1 from public.journal_posts where slug = 'aw-2613082-light-notes'
);

insert into public.journal_posts (slug, title, excerpt, body, related_project_slug)
select
  'kenneth-kaalund-motion-notes',
  'Why This Portrait Became Motion',
  'The image started as a still and only later demanded movement.',
  'The original intention was to make a still portrait, but the subject''s rhythm in front of the camera suggested something slightly more alive. By keeping the motion understated, the clip still behaves like a photograph in the grid while offering more depth when you step inside the project.',
  'kenneth-kaalund-motion'
where not exists (
  select 1 from public.journal_posts where slug = 'kenneth-kaalund-motion-notes'
);

alter table public.site_content enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.project_pages enable row level security;
alter table public.journal_posts enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read portfolio items" on public.portfolio_items;
create policy "Public can read portfolio items"
on public.portfolio_items
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read project pages" on public.project_pages;
create policy "Public can read project pages"
on public.project_pages
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read journal posts" on public.journal_posts;
create policy "Public can read journal posts"
on public.journal_posts
for select
to anon, authenticated
using (true);

drop policy if exists "Public can view portfolio images" on storage.objects;
create policy "Public can view portfolio images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-images');
