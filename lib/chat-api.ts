import { decode } from "base64-arraybuffer";
import type { RealtimeChannel, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { normalizeDisplayName, normalizeUsername, validateBio, validateEmail, validatePassword } from "@/lib/validation";
import type { AppNotification, ChatMessage, ConversationSummary, PendingAttachment, Profile } from "@/shared/chat-types";

type Result<T> = { data: T; error: null } | { data: null; error: Error };
export type FriendshipRelationship = "friends" | "outgoing_pending" | "incoming_pending" | "none";

function toError(error: unknown) {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (error && typeof error === "object") {
    const detail = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const message = typeof detail.message === "string" ? detail.message : "Something went wrong. Please try again.";
    const context = [detail.code, detail.details, detail.hint].filter((value): value is string => typeof value === "string" && value.length > 0).join(" · ");
    return new Error(context ? `${message} (${context})` : message);
  }
  return new Error("Something went wrong. Please try again.");
}

function cleanFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-120) || "attachment";
}

async function getCachedSessionUser(): Promise<Result<User>> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return { data: null, error: toError(error ?? "Please sign in again.") };
  return { data: data.session.user, error: null };
}

export async function getSessionProfile(): Promise<Result<Profile | null>> {
  try {
    const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionResult.session) return { data: null, error: null };
    const { data, error } = await supabase.from("profiles").select("*").eq("id", sessionResult.session.user.id).single();
    if (error) throw error;
    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function signUp(input: { displayName: string; username: string; email: string; password: string; confirmPassword: string }): Promise<Result<"confirmation_required" | "signed_in">> {
  const displayName = normalizeDisplayName(input.displayName);
  const username = normalizeUsername(input.username);
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  if (!displayName.valid) return { data: null, error: new Error(displayName.error) };
  if (!username.valid) return { data: null, error: new Error(username.error) };
  if (!email.valid) return { data: null, error: new Error(email.error) };
  if (!password.valid) return { data: null, error: new Error(password.error) };
  if (input.password !== input.confirmPassword) return { data: null, error: new Error("Passwords do not match.") };
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { display_name: displayName.value, username: username.value } },
  });
  if (error) return { data: null, error: toError(error) };
  return { data: data.session ? "signed_in" : "confirmation_required", error: null };
}

export async function signIn(email: string, password: string): Promise<Result<void>> {
  const validEmail = validateEmail(email);
  if (!validEmail.valid) return { data: null, error: new Error(validEmail.error) };
  const { error } = await supabase.auth.signInWithPassword({ email: validEmail.value, password });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function signOut(): Promise<Result<void>> {
  const { error } = await supabase.auth.signOut();
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function requestPasswordReset(email: string): Promise<Result<void>> {
  const validEmail = validateEmail(email);
  if (!validEmail.valid) return { data: null, error: new Error(validEmail.error) };
  const { error } = await supabase.auth.resetPasswordForEmail(validEmail.value, { redirectTo: "chat://reset-password" });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function updateProfile(updates: Pick<Profile, "display_name" | "username" | "bio">): Promise<Result<Profile>> {
  const displayName = normalizeDisplayName(updates.display_name);
  const username = normalizeUsername(updates.username);
  const bio = validateBio(updates.bio ?? "");
  if (!displayName.valid) return { data: null, error: new Error(displayName.error) };
  if (!username.valid) return { data: null, error: new Error(username.error) };
  if (!bio.valid) return { data: null, error: new Error(bio.error) };
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName.value, username: username.value, bio: bio.value || null })
    .eq("id", cachedUser.data.id)
    .select()
    .single();
  return error ? { data: null, error: toError(error) } : { data: data as Profile, error: null };
}

export async function uploadAvatar(uri: string, mimeType = "image/jpeg"): Promise<Result<Profile>> {
  try {
    const cachedUser = await getCachedSessionUser();
    if (cachedUser.error) throw cachedUser.error;
    const extension = mimeType.split("/")[1] || "jpg";
    const path = `${cachedUser.data.id}/avatar-${Date.now()}.${extension}`;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, arrayBuffer, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", cachedUser.data.id).select().single();
    if (error) throw error;
    return { data: data as Profile, error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function searchProfiles(query: string, limit = 20): Promise<Result<Profile[]>> {
  const term = query.trim().replace(/[%_]/g, "");
  if (!term) return { data: [], error: null };
  const { data, error } = await supabase.from("profiles").select("*").or(`username.ilike.%${term}%,display_name.ilike.%${term}%`).limit(limit);
  return error ? { data: null, error: toError(error) } : { data: (data ?? []) as Profile[], error: null };
}

export async function sendFriendRequest(addresseeId: string): Promise<Result<void>> {
  const { error } = await supabase.rpc("send_friend_request", { p_addressee_id: addresseeId });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function respondToFriendRequest(requestId: string, accept: boolean): Promise<Result<void>> {
  const { error } = await supabase.rpc("respond_to_friend_request", { p_request_id: requestId, p_accept: accept });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function getFriendshipRelationship(otherUserId: string): Promise<Result<FriendshipRelationship>> {
  try {
    const cachedUser = await getCachedSessionUser();
    if (cachedUser.error) throw cachedUser.error;
    const userId = cachedUser.data.id;
    if (userId === otherUserId) return { data: "none", error: null };
    const [lowId, highId] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
    const [friendship, outgoing, incoming] = await Promise.all([
      supabase.from("friendships").select("user_low_id").eq("user_low_id", lowId).eq("user_high_id", highId).maybeSingle(),
      supabase.from("friend_requests").select("id").eq("requester_id", userId).eq("addressee_id", otherUserId).eq("status", "pending").maybeSingle(),
      supabase.from("friend_requests").select("id").eq("requester_id", otherUserId).eq("addressee_id", userId).eq("status", "pending").maybeSingle(),
    ]);
    if (friendship.error) throw friendship.error;
    if (outgoing.error) throw outgoing.error;
    if (incoming.error) throw incoming.error;
    if (friendship.data) return { data: "friends", error: null };
    if (outgoing.data) return { data: "outgoing_pending", error: null };
    if (incoming.data) return { data: "incoming_pending", error: null };
    return { data: "none", error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function respondToGroupInvite(inviteId: string, accept: boolean): Promise<Result<void>> {
  const { error } = await supabase.rpc("respond_to_group_invite", { p_invite_id: inviteId, p_accept: accept });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function getGroupInviteDetails(inviteId: string): Promise<Result<{ invite_id: string; invite_status: "pending" | "accepted" | "declined"; group_id: string; conversation_id: string; group_name: string; group_avatar_path: string | null; inviter_id: string; inviter_name: string; inviter_username: string }>> {
  const { data, error } = await supabase.rpc("get_group_invite_details", { p_invite_id: inviteId }).single();
  return error ? { data: null, error: toError(error) } : { data: data as { invite_id: string; invite_status: "pending" | "accepted" | "declined"; group_id: string; conversation_id: string; group_name: string; group_avatar_path: string | null; inviter_id: string; inviter_name: string; inviter_username: string }, error: null };
}

export async function blockUser(blockedId: string): Promise<Result<void>> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const { error } = await supabase.from("blocks").insert({ blocker_id: cachedUser.data.id, blocked_id: blockedId });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function reportUser(targetUserId: string, reason: string, description?: string): Promise<Result<void>> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const { error } = await supabase.from("reports").insert({ reporter_id: cachedUser.data.id, target_user_id: targetUserId, reason, description: description || null });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function reportMessage(targetMessageId: string, reason = "Message report", description?: string): Promise<Result<void>> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const { error } = await supabase.from("reports").insert({ reporter_id: cachedUser.data.id, target_message_id: targetMessageId, reason, description: description || null });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function requestAccountDeletion(): Promise<Result<void>> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const { error } = await supabase.from("account_deletion_requests").insert({ user_id: cachedUser.data.id });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function createDirectConversation(otherUserId: string): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("create_direct_conversation", { p_other_user_id: otherUserId });
  return error ? { data: null, error: toError(error) } : { data: data as string, error: null };
}

export async function createGroupConversation(name: string, memberIds: string[]): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("create_group_conversation", { p_name: name, p_member_ids: memberIds });
  return error ? { data: null, error: toError(error) } : { data: data as string, error: null };
}

export async function inviteToGroup(groupId: string, inviteeId: string): Promise<Result<void>> {
  const { error } = await supabase.rpc("invite_to_group", { p_group_id: groupId, p_invitee_id: inviteeId });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function setGroupMemberRole(groupId: string, userId: string, roleId: string): Promise<Result<void>> {
  const { error } = await supabase.rpc("set_group_member_role", { p_group_id: groupId, p_user_id: userId, p_role_id: roleId });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function removeGroupMember(groupId: string, userId: string): Promise<Result<void>> {
  const { error } = await supabase.rpc("remove_group_member", { p_group_id: groupId, p_user_id: userId });
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function getGroupDetails(conversationId: string): Promise<Result<{ id: string; name: string; created_by: string; members: Array<{ user_id: string; role_id: string | null; profile: Pick<Profile, "id" | "display_name" | "username" | "avatar_path" | "verified">; role: { id: string; name: string; rank: number } | null }>; roles: Array<{ id: string; name: string; rank: number; can_invite: boolean; can_remove_members: boolean; can_manage_roles: boolean }> }>> {
  try {
    const { data: group, error: groupError } = await supabase.from("groups").select("id, name, created_by").eq("conversation_id", conversationId).single();
    if (groupError) throw new Error(`Group lookup failed for conversation ${conversationId}: ${toError(groupError).message}`);
    if (!group) throw new Error(`Group lookup returned no record for conversation ${conversationId}.`);
    const [{ data: members, error: membersError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase.from("group_members").select("user_id, role_id, profile:profiles!group_members_user_id_fkey(id, display_name, username, avatar_path, verified), role:group_roles!group_members_role_id_fkey(id, name, rank)").eq("group_id", group.id),
      supabase.from("group_roles").select("id, name, rank, can_invite, can_remove_members, can_manage_roles").eq("group_id", group.id).order("rank", { ascending: false }),
    ]);
    if (membersError) throw new Error(`Group member lookup failed: ${toError(membersError).message}`);
    if (rolesError) throw new Error(`Group role lookup failed: ${toError(rolesError).message}`);
    return { data: { ...group, members: (members ?? []) as any, roles: (roles ?? []) as any }, error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function listFriends(): Promise<Result<Profile[]>> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const userId = cachedUser.data.id;
  const { data: friendships, error } = await supabase.from("friendships").select("user_low_id, user_high_id").or(`user_low_id.eq.${userId},user_high_id.eq.${userId}`);
  if (error) return { data: null, error: toError(error) };
  const friendIds = (friendships ?? []).map((friendship) => friendship.user_low_id === userId ? friendship.user_high_id : friendship.user_low_id);
  if (!friendIds.length) return { data: [], error: null };
  const { data, error: profilesError } = await supabase.from("profiles").select("*").in("id", friendIds).order("display_name");
  return profilesError ? { data: null, error: toError(profilesError) } : { data: (data ?? []) as Profile[], error: null };
}

export async function listNotifications(): Promise<Result<AppNotification[]>> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(id, display_name, avatar_path)")
    .order("created_at", { ascending: false })
    .limit(100);
  return error ? { data: null, error: toError(error) } : { data: (data ?? []) as AppNotification[], error: null };
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
}

export async function getUnreadSummary(): Promise<Result<{ messages: number; notifications: number }>> {
  try {
    const cachedUser = await getCachedSessionUser();
    if (cachedUser.error) throw cachedUser.error;
    const userId = cachedUser.data.id;
    const [{ count: notificationsCount, error: notificationsError }, { data: memberships, error: membershipsError }] = await Promise.all([
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
      supabase.from("conversation_members").select("conversation_id, last_read_at").eq("user_id", userId).is("left_at", null),
    ]);
    if (notificationsError) throw notificationsError;
    if (membershipsError) throw membershipsError;
    const unreadCounts = await Promise.all((memberships ?? []).map((membership) => {
      const query = membership.last_read_at
        ? supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", membership.conversation_id).gt("created_at", membership.last_read_at).neq("sender_id", userId)
        : supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", membership.conversation_id).neq("sender_id", userId);
      return query;
    }));
    const messages = unreadCounts.reduce((total, result) => total + (result.count ?? 0), 0);
    return { data: { messages, notifications: notificationsCount ?? 0 }, error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function listConversations(): Promise<Result<ConversationSummary[]>> {
  try {
    const cachedUser = await getCachedSessionUser();
    if (cachedUser.error) throw cachedUser.error;
    const userId = cachedUser.data.id;
    const { data: memberships, error: membershipsError } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at, conversation:conversations!conversation_members_conversation_id_fkey(id, kind, created_by, last_message_at)")
      .eq("user_id", userId)
      .is("left_at", null);
    if (membershipsError) throw membershipsError;
    const records = await Promise.all((memberships ?? []).map(async (membership: any) => {
      const conversation = membership.conversation;
      if (!conversation) return null;
      const [{ data: latestRows, error: latestError }, { data: members, error: membersError }] = await Promise.all([
        supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_path, verified, badges), attachments:message_attachments(*)").eq("conversation_id", conversation.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("conversation_members").select("user_id, profiles!conversation_members_user_id_fkey(id, display_name, avatar_path, verified)").eq("conversation_id", conversation.id).is("left_at", null),
      ]);
      if (latestError || membersError) throw latestError ?? membersError;
      const latest = (latestRows?.[0] ?? null) as ChatMessage | null;
      const unreadQuery = membership.last_read_at
        ? supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversation.id).gt("created_at", membership.last_read_at).neq("sender_id", userId)
        : supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversation.id).neq("sender_id", userId);
      const unread = await unreadQuery;
      if (unread.error) throw unread.error;
      if (conversation.kind === "group") {
        const { data: group, error: groupError } = await supabase.from("groups").select("name, avatar_path").eq("conversation_id", conversation.id).single();
        if (groupError) throw groupError;
        return { id: conversation.id, kind: "group", created_by: conversation.created_by, last_message_at: conversation.last_message_at, title: group.name, avatar_path: group.avatar_path, verified: false, last_message: latest, unread_count: unread.count ?? 0 } as ConversationSummary;
      }
      const other = (members ?? []).find((member: any) => member.user_id !== userId)?.profiles as Pick<Profile, "display_name" | "avatar_path" | "verified"> | undefined;
      return { id: conversation.id, kind: "direct", created_by: conversation.created_by, last_message_at: conversation.last_message_at, title: other?.display_name ?? "Conversation", avatar_path: other?.avatar_path ?? null, verified: other?.verified ?? false, last_message: latest, unread_count: unread.count ?? 0 } as ConversationSummary;
    }));
    return { data: records.filter(Boolean).sort((a, b) => (b!.last_message_at ?? "").localeCompare(a!.last_message_at ?? "")) as ConversationSummary[], error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function listMessages(conversationId: string): Promise<Result<ChatMessage[]>> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_path, verified, badges), attachments:message_attachments(*), reactions:message_reactions(emoji, user_id), reply_to:messages!reply_to_id(id, body, sender:profiles!messages_sender_id_fkey(display_name))")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return error ? { data: null, error: toError(error) } : { data: (data ?? []) as ChatMessage[], error: null };
}

export async function sendMessage(conversationId: string, body: string, replyToId?: string | null): Promise<Result<ChatMessage>> {
  const cleanBody = body.trim();
  if (!cleanBody) return { data: null, error: new Error("Write a message before sending.") };
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: cachedUser.data.id, body: cleanBody, reply_to_id: replyToId ?? null })
    .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_path, verified, badges), attachments:message_attachments(*), reactions:message_reactions(emoji, user_id)")
    .single();
  return error ? { data: null, error: toError(error) } : { data: data as ChatMessage, error: null };
}

export async function editMessage(messageId: string, body: string): Promise<Result<void>> {
  const cleanBody = body.trim();
  if (!cleanBody) return { data: null, error: new Error("An edited message cannot be empty.") };
  const { error } = await supabase.from("messages").update({ body: cleanBody, edited_at: new Date().toISOString() }).eq("id", messageId);
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function deleteMessage(messageId: string): Promise<Result<void>> {
  const { error } = await supabase.from("messages").delete().eq("id", messageId);
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export async function sendAttachment(conversationId: string, attachment: PendingAttachment, messageText = ""): Promise<Result<ChatMessage>> {
  try {
    const cachedUser = await getCachedSessionUser();
    if (cachedUser.error) throw cachedUser.error;
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: cachedUser.data.id, body: messageText.trim() || null, kind: "attachment" })
      .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_path, verified, badges), attachments:message_attachments(*), reactions:message_reactions(emoji, user_id)")
      .single();
    if (messageError) throw messageError;
    const path = `${cachedUser.data.id}/chat/${conversationId}/${Date.now()}-${cleanFileName(attachment.name)}`;
    const uploadBody = attachment.uri.startsWith("data:") ? decode(attachment.uri.split(",")[1]) : await (await fetch(attachment.uri)).arrayBuffer();
    const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, uploadBody, { contentType: attachment.mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const { data: attachmentRow, error: attachmentError } = await supabase
      .from("message_attachments")
      .insert({ message_id: message.id, uploader_id: cachedUser.data.id, kind: attachment.kind, storage_path: path, file_name: cleanFileName(attachment.name), mime_type: attachment.mimeType, byte_size: attachment.size, duration_ms: attachment.durationMs ?? null, width: attachment.width ?? null, height: attachment.height ?? null })
      .select()
      .single();
    if (attachmentError) throw attachmentError;
    if (attachment.kind === "audio" && attachment.durationMs) {
      const { error: voiceError } = await supabase.from("voice_messages").insert({ message_id: message.id, attachment_id: attachmentRow.id, duration_ms: attachment.durationMs });
      if (voiceError) throw voiceError;
    }
    return { data: { ...(message as ChatMessage), attachments: [attachmentRow] }, error: null };
  } catch (error) {
    return { data: null, error: toError(error) };
  }
}

export async function getDownloadUrl(path: string): Promise<Result<string>> {
  const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 5);
  return error || !data?.signedUrl ? { data: null, error: toError(error ?? "File is unavailable.") } : { data: data.signedUrl, error: null };
}

export async function toggleReaction(messageId: string, emoji: string, active: boolean): Promise<Result<void>> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return cachedUser;
  const query = active
    ? supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", cachedUser.data.id).eq("emoji", emoji)
    : supabase.from("message_reactions").insert({ message_id: messageId, user_id: cachedUser.data.id, emoji });
  const { error } = await query;
  return error ? { data: null, error: toError(error) } : { data: undefined, error: null };
}

export function subscribeToConversation(conversationId: string, onMessage: (message: ChatMessage) => void): RealtimeChannel {
  const uniqueTopic = `conversation:${conversationId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return supabase
    .channel(uniqueTopic)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => onMessage(payload.new as ChatMessage))
    .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => onMessage({ conversation_id: conversationId } as ChatMessage))
    .on("postgres_changes", { event: "*", schema: "public", table: "message_attachments" }, () => onMessage({ conversation_id: conversationId } as ChatMessage))
    .subscribe();
}

export function subscribeToConversations(onChange: () => void): RealtimeChannel {
  const uniqueTopic = `conversation-inbox:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return supabase
    .channel(uniqueTopic)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members" }, onChange)
    .subscribe();
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const cachedUser = await getCachedSessionUser();
  if (cachedUser.error) return;
  const readAt = new Date().toISOString();
  await Promise.all([
    supabase.from("conversation_members").update({ last_read_at: readAt }).eq("conversation_id", conversationId).eq("user_id", cachedUser.data.id),
    supabase.from("notifications").update({ read_at: readAt }).eq("user_id", cachedUser.data.id).eq("kind", "message").contains("data", { conversation_id: conversationId }),
  ]);
}
