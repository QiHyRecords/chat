export type Badge = "OWNER" | "ADMIN" | "DEV";
export type ConversationKind = "direct" | "group";
export type AttachmentKind = "image" | "video" | "file" | "audio";
export type NotificationKind = "friend_request" | "friend_accepted" | "group_invite" | "group_role" | "message" | "mention" | "system";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
  status: string;
  verified: boolean;
  badges: Badge[];
  created_at: string;
  updated_at: string;
};

export type MessageAttachment = {
  id: string;
  message_id: string;
  kind: AttachmentKind;
  storage_path: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  reply_to_id: string | null;
  reply_to?: { id: string; body: string | null; sender?: { display_name: string } | null } | null;
  kind: "text" | "attachment" | "system" | "call";
  body: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  sender?: Pick<Profile, "id" | "username" | "display_name" | "avatar_path" | "verified" | "badges"> | null;
  attachments?: MessageAttachment[];
  reactions?: Array<{ emoji: string; user_id: string }>;
};

export type ConversationSummary = {
  id: string;
  kind: ConversationKind;
  created_by: string;
  last_message_at: string | null;
  title: string;
  avatar_path: string | null;
  verified: boolean;
  last_message: ChatMessage | null;
  unread_count: number;
};

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  data: Record<string, string>;
  read_at: string | null;
  created_at: string;
  actor?: Pick<Profile, "id" | "display_name" | "avatar_path"> | null;
};

export type PendingAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  durationMs?: number;
  width?: number;
  height?: number;
};
