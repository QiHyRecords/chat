create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind public.conversation_kind not null,
  direct_key text unique,
  created_by uuid not null references public.profiles(id) on delete restrict,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversations_direct_key check ((kind = 'direct' and direct_key is not null) or (kind = 'group' and direct_key is null))
);

create index conversations_recent_idx on public.conversations (last_message_at desc nulls last);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  primary key (conversation_id, user_id)
);

create index conversation_members_user_idx on public.conversation_members (user_id, conversation_id);

create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function private.is_conversation_member(p_conversation_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.conversation_members where conversation_id = p_conversation_id and user_id = p_user_id and left_at is null)
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;

create policy "Conversation members can view conversations" on public.conversations
for select to authenticated using (private.is_conversation_member(id));
create policy "Conversation members can view members" on public.conversation_members
for select to authenticated using (private.is_conversation_member(conversation_id));
create policy "Conversation members can update their read marker" on public.conversation_members
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
  key_value text;
begin
  if auth.uid() is null or auth.uid() = p_other_user_id then raise exception 'A different account is required'; end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then raise exception 'Account not found'; end if;
  if exists (select 1 from public.blocks where (blocker_id = auth.uid() and blocked_id = p_other_user_id) or (blocker_id = p_other_user_id and blocked_id = auth.uid())) then raise exception 'This conversation is unavailable'; end if;
  key_value := least(auth.uid()::text, p_other_user_id::text) || ':' || greatest(auth.uid()::text, p_other_user_id::text);
  insert into public.conversations (kind, direct_key, created_by)
  values ('direct', key_value, auth.uid())
  on conflict (direct_key) do update set updated_at = public.conversations.updated_at
  returning id into conversation_id;
  insert into public.conversation_members (conversation_id, user_id) values (conversation_id, auth.uid()), (conversation_id, p_other_user_id) on conflict do nothing;
  return conversation_id;
end;
$$;
