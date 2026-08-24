import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("verified identity placement", () => {
  it("keeps verified state separate from privilege badges", () => {
    const types = source("shared/chat-types.ts");
    const components = source("components/chat-ui.tsx");
    const migration = source("supabase/migrations/010_verified_identity.sql");
    expect(types).toContain('verified: boolean');
    expect(types).not.toContain('"VERIFIED"');
    expect(components).toContain("export function InlineIdentity");
    expect(components).not.toContain("VERIFIED: { icon");
    expect(migration).toContain("add column if not exists verified boolean");
  });

  it("uses verified identity only in profile, list, header, and member contexts", () => {
    expect(source("app/profile/[id].tsx")).toContain('label={`@${profile.username}`} verified={profile.verified}');
    expect(source("app/(tabs)/account.tsx")).toContain('label={`@${profile.username}`} verified={profile.verified}');
    expect(source("app/(tabs)/index.tsx")).toContain('verified={item.kind === "direct" && item.verified}');
    expect(source("app/conversation/[id].tsx")).toContain('verified={kind === "direct" && verified === "true"}');
    expect(source("app/group/[id].tsx")).toContain('verified={item.profile.verified}');
  });

  it("does not append verified state to individual message sender names", () => {
    const conversation = source("app/conversation/[id].tsx");
    expect(conversation).toContain('message.sender?.display_name ?? "Member"');
    expect(conversation).not.toContain('message.sender?.verified');
  });
});
