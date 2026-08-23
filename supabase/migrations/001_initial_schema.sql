create extension if not exists "pgcrypto";
create extension if not exists "citext";

create schema if not exists private;

create type public.profile_badge as enum ('OWNER', 'ADMIN', 'DEV', 'VERIFIED');
create type public.conversation_kind as enum ('direct', 'group');
create type public.message_kind as enum ('text', 'attachment', 'system', 'call');
create type public.attachment_kind as enum ('image', 'video', 'file', 'audio');
create type public.friend_request_status as enum ('pending', 'accepted', 'declined', 'cancelled');
create type public.group_invite_status as enum ('pending', 'accepted', 'declined', 'revoked');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.notification_kind as enum ('friend_request', 'friend_accepted', 'group_invite', 'group_role', 'message', 'mention', 'system');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_role()
returns text
language sql
stable
as $$ select coalesce(auth.jwt() ->> 'role', '') $$;
