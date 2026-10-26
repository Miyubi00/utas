begin;

-- Personalization used by the public timeline and admin workspace.
create table if not exists public.app_settings (
  id boolean primary key default true check (id = true),
  site_name text not null default 'Lembar Senja'
    check (char_length(btrim(site_name)) between 1 and 80),
  username text not null default 'lebarsenja'
    check (username ~ '^[A-Za-z0-9._]{1,30}$'),
  tagline text not null default 'Buku catatan hening, kilas rasa, dan penggalan kisah senja'
    check (char_length(btrim(tagline)) between 1 and 160),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;
drop policy if exists "Public read app settings" on public.app_settings;
create policy "Public read app settings"
  on public.app_settings for select to anon, authenticated using (true);
drop policy if exists "Authenticated manage app settings" on public.app_settings;
create policy "Authenticated manage app settings"
  on public.app_settings for all to authenticated using (true) with check (true);
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated;

-- Bot credentials are deliberately unavailable to browser roles.
create table if not exists public.telegram_integrations (
  id boolean primary key default true check (id = true),
  bot_token text not null,
  telegram_user_id text not null check (telegram_user_id ~ '^[0-9]{1,20}$'),
  bot_username text,
  webhook_secret text not null,
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.telegram_integrations enable row level security;
revoke all on public.telegram_integrations from public, anon, authenticated;
grant all on public.telegram_integrations to service_role;

-- Store processed Telegram update IDs so Telegram retries cannot duplicate posts.
create table if not exists public.telegram_processed_updates (
  update_id bigint primary key,
  thread_id uuid references public.thread_posts(id) on delete set null,
  processed_at timestamptz not null default now()
);

alter table public.telegram_processed_updates enable row level security;
revoke all on public.telegram_processed_updates from public, anon, authenticated;
grant all on public.telegram_processed_updates to service_role;

-- This atomic RPC both deduplicates Telegram retries and publishes the post.
create or replace function public.publish_telegram_thread(
  p_update_id bigint,
  p_content text,
  p_parent_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_thread_id uuid;
begin
  if p_update_id is null then
    raise exception 'TELEGRAM_UPDATE_ID_REQUIRED';
  end if;

  if char_length(btrim(coalesce(p_content, ''))) not between 1 and 4000 then
    raise exception 'THREAD_CONTENT_LENGTH_INVALID';
  end if;

  insert into public.telegram_processed_updates (update_id)
  values (p_update_id)
  on conflict (update_id) do nothing;

  if not found then
    return jsonb_build_object('duplicate', true);
  end if;

  if p_parent_id is not null and not exists (
    select 1
    from public.thread_posts
    where id = p_parent_id
      and parent_id is null
      and status = 'published'
  ) then
    raise exception 'PARENT_THREAD_NOT_FOUND';
  end if;

  insert into public.thread_posts (parent_id, content, images, status, is_pinned)
  values (p_parent_id, btrim(p_content), '{}'::text[], 'published', false)
  returning id into v_thread_id;

  update public.telegram_processed_updates
  set thread_id = v_thread_id
  where update_id = p_update_id;

  return jsonb_build_object('duplicate', false, 'thread_id', v_thread_id);
end;
$$;

revoke all on function public.publish_telegram_thread(bigint, text, uuid) from public, anon, authenticated;
grant execute on function public.publish_telegram_thread(bigint, text, uuid) to service_role;

commit;
