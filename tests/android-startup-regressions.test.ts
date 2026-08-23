import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Android startup and authentication-screen safeguards", () => {
  it("does not eagerly resolve the optional video trimmer TurboModule while the route tree starts", () => {
    const editor = source("app/media-editor.tsx");
    expect(editor).toContain("function getNativeVideoTrimmer()");
    expect(editor).toContain('require("react-native-video-trim")');
    expect(editor).not.toContain('import { isValidFile, trim } from "react-native-video-trim"');
  });

  it("keeps Android on the New Architecture required by the installed Reanimated and Worklets runtime", () => {
    const config = source("app.config.ts");
    const gradle = source("android/gradle.properties");
    expect(config).toContain("newArchEnabled: true");
    expect(gradle).toContain("newArchEnabled=true");
  });

  it("uses semantic theme colors for Welcome and Sign in text instead of light-only gray literals", () => {
    const welcome = source("app/welcome.tsx");
    const signIn = source("app/sign-in.tsx");
    expect(welcome).toContain("useColors");
    expect(welcome).toContain("colors.foreground");
    expect(welcome).toContain("colors.muted");
    expect(signIn).toContain("useColors");
    expect(signIn).toContain("colors.foreground");
    expect(signIn).toContain("colors.muted");
    expect(welcome).not.toContain('title: { color: "#171B25"');
    expect(signIn).not.toContain('title: { color: "#171B25"');
  });
});
