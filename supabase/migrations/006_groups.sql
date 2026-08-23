create table public.groups (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  name text not null,
  avatar_path text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint groups_name_length check (char_length(name) between 1 and 80)
);

create table public.group_roles (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  rank smallint not null,
  can_invite boolean not null default false,
  can_remove_members boolean not null default false,
  can_manage_roles boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (group_id, name),
  unique (group_id, rank),
  constraint group_roles_name_length check (char_length(name) between 1 and 32)
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid references public.group_roles(id) on delete set null,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, user_id)
);

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  status public.group_invite_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz,
  constraint group_invites_not_self check (inviter_id <> invitee_id)
);

create unique index group_invites_one_pending_idx on public.group_invites (group_id, invitee_id) where status = 'pending';
create index group_members_user_idx on public.group_members (user_id, group_id);

create trigger groups_set_updated_at before update on public.groups
for each row execute function public.set_updated_at();

create or replace function private.can_manage_group(p_group_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups g
    left join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid()
    left join public.group_roles gr on gr.id = gm.role_id
    where g.id = p_group_id and (g.created_by = auth.uid() or case p_permission when 'invite' then coalesce(gr.can_invite, false) when 'remove' then coalesce(gr.can_remove_members, false) when 'roles' then coalesce(gr.can_manage_roles, false) else false end)
  )
$$;

create or replace function private.is_group_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  )
$$;

alter table public.groups enable row level security;
alter table public.group_roles enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

create policy "Group conversation members can view groups" on public.groups for select to authenticated using (private.is_conversation_member(conversation_id));
create policy "Group members can view roles" on public.group_roles for select to authenticated using (private.is_group_member(group_id));
create policy "Group members can view members" on public.group_members for select to authenticated using (private.is_group_member(group_id));
create policy "Invite participants can view invitations" on public.group_invites for select to authenticated using (auth.uid() in (inviter_id, invitee_id));

create or replace function public.create_group_conversation(p_name text, p_member_ids uuid[] default '{}')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
  group_id uuid;
  owner_role_id uuid;
  member_id uuid;
begin
  if auth.uid() is null or char_length(trim(p_name)) not between 1 and 80 then raise exception 'A group name between 1 and 80 characters is required'; end if;
  insert into public.conversations (kind, created_by) values ('group', auth.uid()) returning id into conversation_id;
  insert into public.groups (conversation_id, name, created_by) values (conversation_id, trim(p_name), auth.uid()) returning id into group_id;
  insert into public.group_roles (group_id, name, rank, can_invite, can_remove_members, can_manage_roles) values (group_id, 'Owner', 100, true, true, true) returning id into owner_role_id;
  insert into public.group_roles (group_id, name, rank, can_invite, can_remove_members, can_manage_roles) values (group_id, 'Moderator', 50, true, true, false), (group_id, 'Member', 0, false, false, false);
  insert into public.group_members (group_id, user_id, role_id) values (group_id, auth.uid(), owner_role_id);
  insert into public.conversation_members (conversation_id, user_id) values (conversation_id, auth.uid());
  foreach member_id in array p_member_ids loop
    if member_id <> auth.uid() and exists (select 1 from public.profiles where id = member_id) then
      insert into public.group_invites (group_id, inviter_id, invitee_id) values (group_id, auth.uid(), member_id) on conflict (group_id, invitee_id) where status = 'pending' do nothing;
    end if;
  end loop;
  return conversation_id;
end;
$$;

create or replace function public.respond_to_group_invite(p_invite_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.group_invites;
  group_conversation_id uuid;
  member_role_id uuid;
begin
  select * into invite_row from public.group_invites where id = p_invite_id and invitee_id = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'Group invite is unavailable'; end if;
  update public.group_invites set status = case when p_accept then 'accepted'::public.group_invite_status else 'declined'::public.group_invite_status end, responded_at = timezone('utc', now()) where id = p_invite_id;
  if p_accept then
    select conversation_id into group_conversation_id from public.groups where id = invite_row.group_id;
    select id into member_role_id from public.group_roles where group_id = invite_row.group_id and name = 'Member';
    insert into public.group_members (group_id, user_id, role_id) values (invite_row.group_id, auth.uid(), member_role_id) on conflict do nothing;
    insert into public.conversation_members (conversation_id, user_id) values (group_conversation_id, auth.uid()) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.invite_to_group(p_group_id uuid, p_invitee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_id uuid;
begin
  if auth.uid() is null or auth.uid() = p_invitee_id or not private.can_manage_group(p_group_id, 'invite') then
    raise exception 'You do not have permission to invite this user';
  end if;
  if exists (select 1 from public.group_members where group_id = p_group_id and user_id = p_invitee_id) then
    raise exception 'This user is already a member';
  end if;
  if exists (select 1 from public.blocks where (blocker_id = auth.uid() and blocked_id = p_invitee_id) or (blocker_id = p_invitee_id and blocked_id = auth.uid())) then
    raise exception 'This invite is unavailable';
  end if;
  insert into public.group_invites (group_id, inviter_id, invitee_id)
  values (p_group_id, auth.uid(), p_invitee_id)
  on conflict (group_id, invitee_id) where status = 'pending' do update set created_at = excluded.created_at
  returning id into invite_id;
  return invite_id;
end;
$$;

create or replace function public.set_group_member_role(p_group_id uuid, p_user_id uuid, p_role_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_rank smallint;
  target_role_rank smallint;
  target_is_owner boolean;
begin
  if auth.uid() is null or not private.can_manage_group(p_group_id, 'roles') then raise exception 'You do not have permission to manage roles'; end if;
  select coalesce(gr.rank, -1), g.created_by = auth.uid() into actor_rank, target_is_owner
  from public.groups g left join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid() left join public.group_roles gr on gr.id = gm.role_id
  where g.id = p_group_id;
  select rank into target_role_rank from public.group_roles where id = p_role_id and group_id = p_group_id;
  if target_role_rank is null or (not target_is_owner and target_role_rank >= actor_rank) then raise exception 'You cannot assign that role'; end if;
  update public.group_members set role_id = p_role_id where group_id = p_group_id and user_id = p_user_id;
  if not found then raise exception 'Group member not found'; end if;
end;
$$;

create or replace function public.remove_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation uuid;
  owner_id uuid;
begin
  select conversation_id, created_by into conversation, owner_id from public.groups where id = p_group_id;
  if conversation is null or p_user_id = owner_id then raise exception 'This member cannot be removed'; end if;
  if auth.uid() <> p_user_id and not private.can_manage_group(p_group_id, 'remove') then raise exception 'You do not have permission to remove this member'; end if;
  delete from public.group_members where group_id = p_group_id and user_id = p_user_id;
  update public.conversation_members set left_at = timezone('utc', now()) where conversation_id = conversation and user_id = p_user_id;
end;
$$;
