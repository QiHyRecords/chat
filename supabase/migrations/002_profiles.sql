create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null,
  bio text,
  avatar_path text,
  status text not null default 'Available',
  badges public.profile_badge[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_format check (username::text ~ '^[a-zA-Z0-9_]{3,32}$'),
  constraint profiles_username_reserved check (lower(username::text) not in ('admin', 'administrator', 'support', 'system', 'chat', 'root', 'owner', 'moderator')),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80),
  constraint profiles_display_name_no_controls check (display_name !~ '[[:cntrl:]]'),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_status_length check (char_length(status) between 1 and 80)
);

create index profiles_username_search_idx on public.profiles (lower(username::text));
create index profiles_display_name_search_idx on public.profiles using gin (to_tsvector('simple', display_name));

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.protect_profile_badges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.badges is distinct from old.badges and public.current_role() <> 'service_role' then
    raise exception 'Profile badges may only be changed by trusted backend logic';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_badges before update on public.profiles
for each row execute function public.protect_profile_badges();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_username text;
  candidate_display_name text;
begin
  candidate_username := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  candidate_username := regexp_replace(candidate_username, '[^a-zA-Z0-9_]', '', 'g');
  candidate_display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1));

  if char_length(candidate_username) < 3 or char_length(candidate_username) > 32 then
    raise exception 'A valid username is required';
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate_username, candidate_display_name);
  return new;
end;
$$;

create trigger auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;

create policy "Profiles are visible to signed-in users"
on public.profiles for select to authenticated using (true);

create policy "Profiles are updated only by their owner"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
