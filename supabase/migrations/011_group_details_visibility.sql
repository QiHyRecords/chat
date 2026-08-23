-- Prevent the group_members self-policy from recursively evaluating itself.
-- Existing installations receive the same member-scoped policy as new installs.
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

drop policy if exists "Group members can view roles" on public.group_roles;
drop policy if exists "Group members can view members" on public.group_members;

create policy "Group members can view roles"
on public.group_roles for select to authenticated
using (private.is_group_member(group_id));

create policy "Group members can view members"
on public.group_members for select to authenticated
using (private.is_group_member(group_id));
