create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  reply_to_id uuid references public.messages(id) on delete set null,
  kind public.message_kind not null default 'text',
  body text,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_body_length check (body is null or char_length(body) <= 4000),
  constraint messages_content_check check (kind <> 'text' or body is not null)
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index messages_reply_idx on public.messages (reply_to_id) where reply_to_id is not null;

alter table public.reports
add constraint reports_target_message_id_fkey
foreign key (target_message_id) references public.messages(id) on delete set null;

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  kind public.attachment_kind not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null,
  width integer,
  height integer,
  duration_ms integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint attachments_name_length check (char_length(file_name) between 1 and 255),
  constraint attachments_size check (byte_size > 0 and byte_size <= 104857600),
  constraint attachments_duration check (duration_ms is null or duration_ms > 0)
);

create index attachments_message_idx on public.message_attachments (message_id);

create table public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (message_id, user_id, emoji),
  constraint reactions_emoji_length check (char_length(emoji) between 1 and 16)
);

create table public.voice_messages (
  message_id uuid primary key references public.messages(id) on delete cascade,
  attachment_id uuid not null unique references public.message_attachments(id) on delete cascade,
  duration_ms integer not null check (duration_ms > 0),
  waveform smallint[]
);

create or replace function private.can_send_message(p_conversation_id uuid, p_sender_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_conversation_member(p_conversation_id, p_sender_id)
    and not exists (
      select 1
      from public.conversations c
      join public.conversation_members other_member on other_member.conversation_id = c.id and other_member.user_id <> p_sender_id and other_member.left_at is null
      join public.blocks b on (b.blocker_id = p_sender_id and b.blocked_id = other_member.user_id) or (b.blocker_id = other_member.user_id and b.blocked_id = p_sender_id)
      where c.id = p_conversation_id and c.kind = 'direct'
    )
$$;

create or replace function public.touch_conversation_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at, updated_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation after insert on public.messages
for each row execute function public.touch_conversation_from_message();

alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reactions enable row level security;
alter table public.voice_messages enable row level security;

create policy "Conversation members can read messages" on public.messages
for select to authenticated using (private.is_conversation_member(conversation_id));
create policy "Conversation members can send their own messages" on public.messages
for insert to authenticated with check (sender_id = auth.uid() and private.can_send_message(conversation_id));
create policy "Senders may edit recent messages" on public.messages
for update to authenticated using (sender_id = auth.uid() and created_at > timezone('utc', now()) - interval '15 minutes') with check (sender_id = auth.uid());
create policy "Senders may delete their messages" on public.messages
for delete to authenticated using (sender_id = auth.uid());
create policy "Members can read message attachments" on public.message_attachments
for select to authenticated using (exists (select 1 from public.messages m where m.id = message_id and private.is_conversation_member(m.conversation_id)));
create policy "Uploaders can add an attachment to their own message" on public.message_attachments
for insert to authenticated with check (uploader_id = auth.uid() and storage_path like auth.uid()::text || '/%' and exists (select 1 from public.messages m where m.id = message_id and m.sender_id = auth.uid()));
create policy "Members can read reactions" on public.message_reactions
for select to authenticated using (exists (select 1 from public.messages m where m.id = message_id and private.is_conversation_member(m.conversation_id)));
create policy "Members can react as themselves" on public.message_reactions
for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and private.is_conversation_member(m.conversation_id)));
create policy "Users can remove their reactions" on public.message_reactions
for delete to authenticated using (user_id = auth.uid());
create policy "Members can read voice metadata" on public.voice_messages
for select to authenticated using (exists (select 1 from public.messages m where m.id = voice_messages.message_id and private.is_conversation_member(m.conversation_id)));
