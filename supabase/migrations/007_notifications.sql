create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind public.notification_kind not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  allow_push_notifications boolean not null default true,
  allow_friend_requests boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger user_settings_set_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();
create trigger device_tokens_set_updated_at before update on public.device_push_tokens
for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;
alter table public.device_push_tokens enable row level security;

create policy "Users can view their notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users can mark their own notifications read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can view their own settings" on public.user_settings for select to authenticated using (user_id = auth.uid());
create policy "Users can create their own settings" on public.user_settings for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update their own settings" on public.user_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can manage their own device tokens" on public.device_push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, title, body, data)
  values (new.addressee_id, new.requester_id, 'friend_request', 'New friend request', 'You have a new friend request.', jsonb_build_object('friend_request_id', new.id));
  return new;
end;
$$;
create trigger friend_request_notification after insert on public.friend_requests for each row execute function public.notify_friend_request();

create or replace function public.notify_friend_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.notifications (user_id, actor_id, kind, title, body, data)
    values (new.requester_id, new.addressee_id, 'friend_accepted', 'Friend request accepted', 'Your friend request was accepted.', jsonb_build_object('friend_request_id', new.id));
  end if;
  return new;
end;
$$;
create trigger friend_accepted_notification after update on public.friend_requests for each row execute function public.notify_friend_accepted();

create or replace function public.notify_group_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, title, body, data)
  values (new.invitee_id, new.inviter_id, 'group_invite', 'New group invitation', 'You have been invited to join a group.', jsonb_build_object('group_invite_id', new.id, 'group_id', new.group_id));
  return new;
end;
$$;
create trigger group_invite_notification after insert on public.group_invites for each row execute function public.notify_group_invite();

create or replace function public.notify_conversation_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, title, body, data)
  select cm.user_id, new.sender_id, 'message', coalesce(sender.display_name, 'New message'), left(coalesce(new.body, 'Sent an attachment'), 160), jsonb_build_object('conversation_id', new.conversation_id)
  from public.conversation_members cm
  left join public.profiles sender on sender.id = new.sender_id
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id
    and cm.left_at is null
    and not exists (select 1 from public.blocks b where (b.blocker_id = cm.user_id and b.blocked_id = new.sender_id) or (b.blocker_id = new.sender_id and b.blocked_id = cm.user_id));
  return new;
end;
$$;
create trigger message_notification after insert on public.messages for each row execute function public.notify_conversation_members();
