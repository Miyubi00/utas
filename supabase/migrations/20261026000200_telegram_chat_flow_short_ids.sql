begin;

-- Public, human-friendly identifiers used by the Telegram bot.
alter table public.thread_posts
  add column if not exists short_id text;

create or replace function public.generate_thread_short_id()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_candidate text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    select string_agg(
      substr(v_alphabet, floor(random() * length(v_alphabet) + 1)::integer, 1),
      '' order by seq
    )
    into v_candidate
    from generate_series(1, 6) as chars(seq);

    exit when not exists (
      select 1 from public.thread_posts where short_id = v_candidate
    );
  end loop;
  return v_candidate;
end;
$$;

update public.thread_posts
set short_id = public.generate_thread_short_id()
where short_id is null;

alter table public.thread_posts
  alter column short_id set default public.generate_thread_short_id(),
  alter column short_id set not null;

create unique index if not exists idx_thread_posts_short_id
  on public.thread_posts (short_id);

-- Store each private Telegram chat's active multi-step command.
create table if not exists public.telegram_conversations (
  chat_id text primary key check (chat_id ~ '^[0-9]{1,20}$'),
  state text not null check (state in (
    'thread_content', 'reply_id', 'reply_content', 'list_page', 'delete_id', 'delete_confirm'
  )),
  target_thread_id uuid references public.thread_posts(id) on delete cascade,
  target_short_id text,
  updated_at timestamptz not null default now()
);

alter table public.telegram_conversations enable row level security;
revoke all on public.telegram_conversations from public, anon, authenticated;
grant all on public.telegram_conversations to service_role;

-- Include the short ID in the result while preserving UUID for internal relations.
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
  v_short_id text;
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
  returning id, short_id into v_thread_id, v_short_id;

  update public.telegram_processed_updates
  set thread_id = v_thread_id
  where update_id = p_update_id;

  return jsonb_build_object(
    'duplicate', false,
    'thread_id', v_thread_id,
    'short_id', v_short_id
  );
end;
$$;

revoke all on function public.publish_telegram_thread(bigint, text, uuid) from public, anon, authenticated;
grant execute on function public.publish_telegram_thread(bigint, text, uuid) to service_role;

commit;

