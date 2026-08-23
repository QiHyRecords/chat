import { describe, expect, it } from "vitest";

import { normalizeDisplayName, normalizeUsername, validateBio, validateEmail, validatePassword } from "../lib/validation";

describe("Chat account validation", () => {
  it("normalizes a permitted display name without requiring uniqueness", () => {
    expect(normalizeDisplayName("  Morgan   Reyes ")).toEqual({ valid: true, value: "Morgan Reyes" });
  });

  it("rejects control characters in public profile fields", () => {
    expect(normalizeDisplayName("Morgan\nReyes")).toEqual({ valid: false, error: "Display name contains unsupported characters." });
    expect(validateBio("Hello\u0000there")).toEqual({ valid: false, error: "Bio contains unsupported characters." });
  });

  it("normalizes usernames consistently and protects reserved names", () => {
    expect(normalizeUsername("  Morgan_17 ")).toEqual({ valid: true, value: "morgan_17" });
    expect(normalizeUsername("ADMIN")).toEqual({ valid: false, error: "That username is reserved." });
  });

  it("requires a valid email and a minimally strong password", () => {
    expect(validateEmail("not-an-email").valid).toBe(false);
    expect(validatePassword("short1").valid).toBe(false);
    expect(validatePassword("chatpass1")).toEqual({ valid: true, value: "chatpass1" });
  });
});
