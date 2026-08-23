insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-media', 'chat-media', false, 104857600, null)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_read_chat_media(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
    from public.message_attachments a
    join public.messages m on m.id = a.message_id
    where a.storage_path = p_name and private.is_conversation_member(m.conversation_id)
  )
$$;

create policy "Anyone can read public avatars" on storage.objects
for select using (bucket_id = 'avatars');
create policy "Users upload avatars to their own folder" on storage.objects
for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update avatars in their own folder" on storage.objects
for update to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid()) with check (bucket_id = 'avatars' and owner_id = auth.uid());
create policy "Users delete avatars in their own folder" on storage.objects
for delete to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid());

create policy "Conversation members can download chat media" on storage.objects
for select to authenticated using (bucket_id = 'chat-media' and private.can_read_chat_media(name));
create policy "Users upload chat media to their own folder" on storage.objects
for insert to authenticated with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete their uploads" on storage.objects
for delete to authenticated using (bucket_id = 'chat-media' and owner_id = auth.uid());
