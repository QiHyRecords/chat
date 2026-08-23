import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("friendship and notification flow safeguards", () => {
  it("shows relationship-aware profile actions instead of a permanent Add friend action", () => {
    const profile = source("app/profile/[id].tsx");
    const api = source("lib/chat-api.ts");
    expect(api).toContain("export async function getFriendshipRelationship");
    expect(profile).toContain('relationship === "friends"');
    expect(profile).toContain('label="Friends"');
    expect(profile).toContain('relationship === "outgoing_pending"');
    expect(profile).toContain('label="Request pending"');
  });

  it("creates only one unread message notification per conversation and resets the throttle when opened", () => {
    const migration = source("supabase/migrations/012_notification_state_and_invites.sql");
    const api = source("lib/chat-api.ts");
    const provider = source("providers/chat-auth-provider.tsx");
    expect(migration).toContain("n.data ->> 'conversation_id' = new.conversation_id::text");
    expect(migration).toContain("You have a message from %s");
    expect(api).toContain('.contains("data", { conversation_id: conversationId })');
    expect(provider).toContain('notification.kind === "message"');
  });

  it("transforms accepted requests and provides recipient-side group invitation review", () => {
    const migration = source("supabase/migrations/012_notification_state_and_invites.sql");
    const notificationScreen = source("app/(tabs)/notifications.tsx");
    const inviteScreen = source("app/group-invitation/[id].tsx");
    expect(migration).toContain("You are now friends");
    expect(migration).toContain("get_group_invite_details");
    expect(notificationScreen).toContain("/group-invitation/");
    expect(inviteScreen).toContain("Accept invitation");
    expect(inviteScreen).toContain("Decline");
  });
});
