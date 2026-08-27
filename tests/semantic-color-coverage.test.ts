import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const screens = ["app/(tabs)/account.tsx", "app/(tabs)/index.tsx", "app/conversation/[id].tsx", "app/profile/[id].tsx", "app/group/[id].tsx"];

describe("semantic color coverage", () => {
  it("keeps the primary user journeys on the shared dynamic palette", () => {
    for (const screen of screens) {
      const source = readFileSync(join(root, screen), "utf8");
      expect(source, screen).toContain("useColors");
      expect(source, screen).not.toMatch(/#[0-9A-Fa-f]{6}/);
    }
  });

  it("keeps app and shared component source free of fixed color literals", () => {
    const files = ["components/chat-ui.tsx", "app/(tabs)/friends.tsx", "app/(tabs)/notifications.tsx", "app/group-invite/[id].tsx", "app/call/[id].tsx"];
    for (const file of files) expect(readFileSync(join(root, file), "utf8"), file).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  it("keeps the clay elevation system centralized and present on core journeys", () => {
    const primitive = readFileSync(join(root, "components/clay-ui.tsx"), "utf8");
    expect(primitive).toContain("ClayPressable");
    expect(primitive).toContain("ClaySurface");
    expect(primitive).toContain("clayHighlight");
    expect(primitive).toContain("clayShadow");
    const clayScreens = [
      "app/welcome.tsx", "app/sign-up.tsx", "app/find-people.tsx", "app/new-conversation.tsx",
      "app/(tabs)/account.tsx", "app/(tabs)/friends.tsx", "app/(tabs)/notifications.tsx",
      "app/conversation/[id].tsx", "app/profile/[id].tsx", "app/group/[id].tsx",
      "app/call/[id].tsx", "app/media-editor.tsx", "components/message-attachment.tsx",
      "components/voice-recorder-button.tsx",
    ];
    for (const file of clayScreens) expect(readFileSync(join(root, file), "utf8"), file).toMatch(/ClayPressable|ClaySurface|useClayStyles/);
  });
});
