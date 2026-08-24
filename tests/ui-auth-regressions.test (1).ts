import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Chat authentication and interface regressions", () => {
  it("limits conversation membership rows to the signed-in user", () => {
    const api = source("lib/chat-api.ts");
    const listStart = api.indexOf("export async function listConversations");
    const listEnd = api.indexOf("export async function listMessages", listStart);
    const section = api.slice(listStart, listEnd);
    expect(section).toContain('.eq("user_id", userId)');
  });

  it("clears client state and routes away from protected screens on sign out", () => {
    const provider = source("providers/chat-auth-provider.tsx");
    const root = source("app/_layout.tsx");
    expect(provider).toContain("setSession(null);");
    expect(provider).toContain("setProfile(null);");
    expect(provider).toContain("setProfileError(null);");
    expect(root).toContain("function AuthNavigationGate");
    expect(root).toContain('router.replace("/welcome" as never)');
  });

  it("keeps Account in a loading state until profile retrieval resolves", () => {
    const provider = source("providers/chat-auth-provider.tsx");
    const account = source("app/(tabs)/account.tsx");
    expect(provider).toContain("profileLoading");
    expect(account).toContain("if (profileLoading && !profile)");
    expect(account).toContain('FullScreenLoader label="Loading account"');
  });

  it("uses semantic light and dark tokens instead of logging theme internals", () => {
    const theme = source("theme.config.js");
    const provider = source("lib/theme-provider.tsx");
    expect(theme).toContain("elevated:");
    expect(theme).toContain("accentSoft:");
    expect(theme).toContain("onPrimary:");
    expect(provider).not.toContain("console.log");
  });
});
