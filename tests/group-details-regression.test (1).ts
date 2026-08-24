import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("group details safeguards", () => {
  it("creates the group, roles, owner membership, and conversation membership atomically", () => {
    const migration = source("supabase/migrations/006_groups.sql");
    const fnStart = migration.indexOf("create or replace function public.create_group_conversation");
    const section = migration.slice(fnStart, migration.indexOf("create or replace function public.respond_to_group_invite", fnStart));
    expect(section).toContain("insert into public.groups");
    expect(section).toContain("insert into public.group_roles");
    expect(section).toContain("insert into public.group_members");
    expect(section).toContain("insert into public.conversation_members");
  });

  it("uses a security-definer helper rather than a self-recursive member visibility query", () => {
    const base = source("supabase/migrations/006_groups.sql");
    const repair = source("supabase/migrations/011_group_details_visibility.sql");
    expect(base).toContain("create or replace function private.is_group_member");
    expect(base).toContain("using (private.is_group_member(group_id))");
    expect(base).not.toContain("public.group_members own");
    expect(repair).toContain("drop policy if exists \"Group members can view members\"");
    expect(repair).toContain("security definer");
  });

  it("returns specific group lookup, member, and role errors to the client", () => {
    const api = source("lib/chat-api.ts");
    expect(api).toContain("Group lookup failed for conversation");
    expect(api).toContain("Group member lookup failed");
    expect(api).toContain("Group role lookup failed");
  });
});
