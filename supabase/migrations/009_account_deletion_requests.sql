create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'cancelled', 'processed')),
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  note text
);

alter table public.account_deletion_requests enable row level security;

create policy "Users can view their own deletion request" on public.account_deletion_requests
for select to authenticated using (user_id = auth.uid());
create policy "Users can submit their own deletion request" on public.account_deletion_requests
for insert to authenticated with check (user_id = auth.uid());
create policy "Users can cancel their own pending request" on public.account_deletion_requests
for update to authenticated using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'cancelled');
