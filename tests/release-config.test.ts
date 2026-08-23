import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Chat release configuration", () => {
  it("contains the required Android branding assets", () => {
    ["icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png"].forEach((asset) => {
      expect(existsSync(join(root, "assets", "images", asset))).toBe(true);
    });
    const config = readFileSync(join(root, "app.config.ts"), "utf8");
    expect(config).toContain('appName: "Chat"');
    expect(config).toContain('logoUrl: "/manus-storage/chat-icon_8dcd0e50.png"');
  });

  it("builds and uploads an Android release APK in GitHub Actions", () => {
    const workflow = readFileSync(join(root, ".github", "workflows", "android-apk.yml"), "utf8");
    expect(workflow).toContain("actions/checkout@v4");
    expect(workflow).toContain("actions/setup-java@v4");
    expect(workflow).toContain("./gradlew :app:assembleRelease");
    expect(workflow).toContain("actions/upload-artifact@v4");
  });

  it("models attachment-only messages as a distinct backend message kind", () => {
    const schema = readFileSync(join(root, "supabase", "migrations", "001_initial_schema.sql"), "utf8");
    const client = readFileSync(join(root, "lib", "chat-api.ts"), "utf8");
    expect(schema).toContain("'attachment'");
    expect(client).toContain('kind: "attachment"');
  });
});
