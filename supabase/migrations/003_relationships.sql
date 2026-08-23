create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz,
  constraint friend_requests_not_self check (requester_id <> addressee_id)
);

create unique index friend_requests_one_pending_direction
on public.friend_requests (requester_id, addressee_id)
where status = 'pending';

create table public.friendships (
  user_low_id uuid not null references public.profiles(id) on delete cascade,
  user_high_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_low_id, user_high_id),
  constraint friendships_sorted_users check (user_low_id::text < user_high_id::text)
);

create index friendships_low_idx on public.friendships (user_low_id);
create index friendships_high_idx on public.friendships (user_high_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_message_id uuid,
  reason text not null,
  description text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reports_reason_length check (char_length(reason) between 3 and 120),
  constraint reports_description_length check (description is null or char_length(description) <= 2000),
  constraint reports_has_target check (target_user_id is not null or target_message_id is not null)
);

create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "Friend request participants can view requests" on public.friend_requests
for select to authenticated using (auth.uid() in (requester_id, addressee_id));
create policy "Only the requester can create a request" on public.friend_requests
for insert to authenticated with check (auth.uid() = requester_id and requester_id <> addressee_id);
create policy "Request participants may remove a request" on public.friend_requests
for delete to authenticated using (auth.uid() in (requester_id, addressee_id));
create policy "Only addressees may respond to requests" on public.friend_requests
for update to authenticated using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);

create policy "Users can view their friendships" on public.friendships
for select to authenticated using (auth.uid() in (user_low_id, user_high_id));
create policy "Users can view their own blocks" on public.blocks
for select to authenticated using (auth.uid() = blocker_id);
create policy "Users can create their own blocks" on public.blocks
for insert to authenticated with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
create policy "Users can remove their own blocks" on public.blocks
for delete to authenticated using (auth.uid() = blocker_id);
create policy "Users can create reports" on public.reports
for insert to authenticated with check (auth.uid() = reporter_id);
create policy "Reporters can view their reports" on public.reports
for select to authenticated using (auth.uid() = reporter_id);

create or replace function public.send_friend_request(p_addressee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  if auth.uid() is null or auth.uid() = p_addressee_id then
    raise exception 'You cannot send a friend request to this account';
  end if;
  if exists (select 1 from public.blocks where (blocker_id = auth.uid() and blocked_id = p_addressee_id) or (blocker_id = p_addressee_id and blocked_id = auth.uid())) then
    raise exception 'This request is unavailable';
  end if;
  if exists (select 1 from public.friendships where user_low_id = least(auth.uid(), p_addressee_id) and user_high_id = greatest(auth.uid(), p_addressee_id)) then
    raise exception 'You are already friends';
  end if;
  insert into public.friend_requests (requester_id, addressee_id)
  values (auth.uid(), p_addressee_id)
  on conflict (requester_id, addressee_id) where status = 'pending' do update set created_at = excluded.created_at
  returning id into request_id;
  return request_id;
end;
$$;

create or replace function public.respond_to_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.friend_requests;
begin
  select * into request_row from public.friend_requests where id = p_request_id and addressee_id = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'Friend request is unavailable'; end if;
  update public.friend_requests set status = case when p_accept then 'accepted'::public.friend_request_status else 'declined'::public.friend_request_status end, responded_at = timezone('utc', now()) where id = p_request_id;
  if p_accept then
    insert into public.friendships (user_low_id, user_high_id) values (least(request_row.requester_id, request_row.addressee_id), greatest(request_row.requester_id, request_row.addressee_id)) on conflict do nothing;
  end if;
end;
$$;
