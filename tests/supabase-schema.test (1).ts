import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");
const migration = (name: string) => readFileSync(join(migrationsDirectory, name), "utf8");

describe("Supabase schema safeguards", () => {
  it("creates profile ownership, username uniqueness, and protected badges", () => {
    const sql = migration("002_profiles.sql");
    expect(sql).toContain("username citext not null unique");
    expect(sql).toContain("alter table public.profiles enable row level security");
    expect(sql).toContain("Profile badges may only be changed by trusted backend logic");
  });

  it("enforces relationship, messaging, and storage security at the database level", () => {
    const relationships = migration("003_relationships.sql");
    const messages = migration("005_messages.sql");
    const storage = migration("008_storage.sql");
    expect(relationships).toContain("constraint friend_requests_not_self");
    expect(relationships).toContain("public.blocks");
    expect(messages).toContain("private.can_send_message");
    expect(messages).toContain("alter table public.messages enable row level security");
    expect(storage).toContain("private.can_read_chat_media");
    expect(storage).toContain("Users upload avatars to their own folder");
  });
});
