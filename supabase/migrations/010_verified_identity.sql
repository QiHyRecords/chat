-- VERIFIED is an identity status, not a privilege badge. Backfill legacy badge data
-- without exposing client-side mutation of verification status.
alter table public.profiles
add column if not exists verified boolean not null default false;

update public.profiles
set verified = true
where 'VERIFIED' = any(badges);

update public.profiles
set badges = array_remove(badges, 'VERIFIED'::public.profile_badge)
where 'VERIFIED' = any(badges);

create or replace function public.protect_profile_badges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.badges is distinct from old.badges or new.verified is distinct from old.verified)
    and public.current_role() <> 'service_role' then
    raise exception 'Profile badges and verification may only be changed by trusted backend logic';
  end if;
  return new;
end;
$$;
