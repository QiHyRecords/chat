import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");

describe("messaging overhaul regression coverage", () => {
  it("uses an explicit theme-aware system status bar and Android keyboard resize", () => {
    expect(source("app/_layout.tsx")).toContain("ThemeAwareStatusBar");
    expect(source("app/_layout.tsx")).toContain('style={scheme === "dark" ? "light" : "dark"}');
    expect(source("app.config.ts")).toContain('softwareKeyboardLayoutMode: "resize"');
  });

  it("refreshes inbox and conversation data through focus and realtime paths", () => {
    expect(source("app/(tabs)/index.tsx")).toContain("subscribeToConversations");
    expect(source("app/(tabs)/index.tsx")).toContain("useFocusEffect");
    expect(source("app/conversation/[id].tsx")).toContain("scrollToLatest");
    expect(source("app/conversation/[id].tsx")).toContain("useFocusEffect");
    expect(source("lib/chat-api.ts")).toContain('event: "*", schema: "public", table: "messages"');
  });

  it("routes media through camera and editor workflows before upload", () => {
    expect(source("app/conversation/[id].tsx")).toContain('pathname: "/media-editor"');
    expect(source("app/conversation/[id].tsx")).toContain('pathname: "/camera-capture"');
    expect(source("app/media-editor.tsx")).toContain("ImageManipulator.manipulateAsync");
    expect(source("app/media-editor.tsx")).toContain('from "react-native-video-trim"');
    expect(source("app/media-editor.tsx")).toContain("await trim(");
    expect(source("app/media-editor.tsx")).toContain("outputPath");
    expect(source("app/camera-capture.tsx")).toContain("CameraView");
    expect(source("app/camera-capture.tsx")).toContain('<StatusBar backgroundColor="#000000" style="light"');
    expect(source("components/media-viewer.tsx")).toContain("saveToLibraryAsync");
    expect(source("components/media-viewer.tsx")).toContain('<StatusBar backgroundColor="#050914" style="light"');
  });

  it("provides compact voice playback and multi-emoji reaction interactions", () => {
    expect(source("components/voice-recorder-button.tsx")).toContain("state.durationMillis");
    expect(source("components/message-attachment.tsx")).toContain("useAudioPlayerStatus");
    expect(source("app/conversation/[id].tsx")).toContain("REACTION_EMOJIS");
    expect(source("app/conversation/[id].tsx")).toContain('onReact("❤️")');
  });
});
