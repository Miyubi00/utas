begin;

create extension if not exists "uuid-ossp";

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  mood text,
  tags text[] default '{}',
  cover_url text,
  is_pinned boolean default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  entry_date date not null default current_date,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_entries_status_created_at on public.entries (status, created_at desc);
create index if not exists idx_entries_slug on public.entries (slug);
create index if not exists idx_entries_entry_date on public.entries (entry_date desc);
create index if not exists idx_entries_is_pinned on public.entries (is_pinned);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_entries_updated_at on public.entries;
create trigger set_entries_updated_at
  before update on public.entries
  for each row execute function public.handle_updated_at();

create table if not exists public.thread_posts (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.thread_posts(id) on delete cascade,
  content text not null,
  images text[] default '{}',
  status text not null default 'published' check (status in ('draft', 'published')),
  is_pinned boolean default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_thread_posts_parent_id on public.thread_posts (parent_id);
create index if not exists idx_thread_posts_status_created_at on public.thread_posts (status, created_at desc);
create index if not exists idx_thread_posts_is_pinned on public.thread_posts (is_pinned);

alter table public.entries enable row level security;
alter table public.thread_posts enable row level security;

drop policy if exists "Public read published entries" on public.entries;
create policy "Public read published entries"
  on public.entries for select to anon, authenticated
  using (status = 'published');
drop policy if exists "Admin full access entries" on public.entries;
create policy "Admin full access entries"
  on public.entries for all to authenticated
  using (true) with check (true);

drop policy if exists "Public read published threads" on public.thread_posts;
create policy "Public read published threads"
  on public.thread_posts for select to anon, authenticated
  using (status = 'published');
drop policy if exists "Admin full access threads" on public.thread_posts;
create policy "Admin full access threads"
  on public.thread_posts for all to authenticated
  using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read storage images" on storage.objects;
create policy "Public read storage images"
  on storage.objects for select to public
  using (bucket_id = 'images');
drop policy if exists "Admin upload storage images" on storage.objects;
create policy "Admin upload storage images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images');
drop policy if exists "Admin update storage images" on storage.objects;
create policy "Admin update storage images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images');
drop policy if exists "Admin delete storage images" on storage.objects;
create policy "Admin delete storage images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images');

commit;
