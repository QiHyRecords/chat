-- Notification state fixes: one unread message alert per conversation, actionable requests,
-- and recipient-visible group details before an invitation is accepted.

create or replace function private.is_pending_group_invitee(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_invites
    where group_id = p_group_id and invitee_id = p_user_id and status = 'pending'
  )
$$;

drop policy if exists "Group conversation members can view groups" on public.groups;
create policy "Group members and invitees can view group summaries" on public.groups
for select to authenticated using (
  private.is_conversation_member(conversation_id)
  or private.is_pending_group_invitee(id)
);

create or replace function public.notify_friend_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  addressee_name text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    select display_name into requester_name from public.profiles where id = new.requester_id;
    select display_name into addressee_name from public.profiles where id = new.addressee_id;

    -- Transform the original recipient request item instead of leaving a stale request behind.
    update public.notifications
    set kind = 'friend_accepted',
        title = 'You are now friends',
        body = format('You and %s are now friends.', coalesce(requester_name, 'this person')),
        data = data || jsonb_build_object('friend_request_id', new.id, 'status', 'accepted'),
        read_at = null
    where user_id = new.addressee_id
      and kind = 'friend_request'
      and data ->> 'friend_request_id' = new.id::text;

    insert into public.notifications (user_id, actor_id, kind, title, body, data)
    values (
      new.requester_id,
      new.addressee_id,
      'friend_accepted',
      'You are now friends',
      format('You and %s are now friends.', coalesce(addressee_name, 'this person')),
      jsonb_build_object('friend_request_id', new.id, 'status', 'accepted')
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_conversation_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  select display_name into sender_name from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, actor_id, kind, title, body, data)
  select
    cm.user_id,
    new.sender_id,
    'message',
    format('You have a message from %s', coalesce(sender_name, 'someone')),
    left(coalesce(new.body, 'Sent an attachment'), 160),
    jsonb_build_object('conversation_id', new.conversation_id)
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id
    and cm.left_at is null
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = cm.user_id and b.blocked_id = new.sender_id)
         or (b.blocker_id = new.sender_id and b.blocked_id = cm.user_id)
    )
    and not exists (
      select 1 from public.notifications n
      where n.user_id = cm.user_id
        and n.kind = 'message'
        and n.read_at is null
        and n.data ->> 'conversation_id' = new.conversation_id::text
    );
  return new;
end;
$$;

create or replace function public.get_group_invite_details(p_invite_id uuid)
returns table (
  invite_id uuid,
  invite_status public.group_invite_status,
  group_id uuid,
  conversation_id uuid,
  group_name text,
  group_avatar_path text,
  inviter_id uuid,
  inviter_name text,
  inviter_username text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gi.id,
    gi.status,
    g.id,
    g.conversation_id,
    g.name,
    g.avatar_path,
    inviter.id,
    inviter.display_name,
    inviter.username
  from public.group_invites gi
  join public.groups g on g.id = gi.group_id
  join public.profiles inviter on inviter.id = gi.inviter_id
  where gi.id = p_invite_id
    and gi.invitee_id = auth.uid()
$$;
