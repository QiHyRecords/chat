import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Supabase regression safeguards", () => {
  it("uses cached sessions instead of network user lookups for authenticated actions", () => {
    const api = source("lib/chat-api.ts");
    expect(api).toContain("async function getCachedSessionUser()");
    expect(api).toContain("supabase.auth.getSession()");
    expect(api).not.toContain("supabase.auth.getUser()");
    expect(api).toContain("export async function sendMessage");
    expect(api).toContain("export async function sendAttachment");
  });

  it("refetches profile data when the dynamic profile id changes from every people entry point", () => {
    const profile = source("app/profile/[id].tsx");
    const friends = source("app/(tabs)/friends.tsx");
    const people = source("app/find-people.tsx");
    const group = source("app/group/[id].tsx");
    expect(profile).toContain('.eq("id", id).single()');
    expect(profile).toContain("useFocusEffect");
    expect(profile).toContain("getFriendshipRelationship");
    expect(friends).toContain("`/profile/${item.id}`");
    expect(people).toContain("`/profile/${item.id}`");
    expect(group).toContain("`/profile/${item.user_id}`");
  });

  it("uploads an attachment before creating its metadata and grants the owner upload access", () => {
    const api = source("lib/chat-api.ts");
    const storage = source("supabase/migrations/008_storage.sql");
    expect(api.indexOf('storage.from("chat-media").upload')).toBeLessThan(api.indexOf('from("message_attachments")'));
    expect(storage).toContain('bucket_id = \'chat-media\' and (storage.foldername(name))[1] = auth.uid()::text');
    expect(storage).toContain('private.can_read_chat_media(name)');
  });
});
