import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

describe("Supabase public configuration", () => {
  it("authenticates a lightweight project settings request", async () => {
    expect(supabaseUrl, "EXPO_PUBLIC_SUPABASE_URL must be configured").toMatch(/^https:\/\//);
    expect(supabasePublishableKey, "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured").toBeTruthy();

    const response = await fetch(`${supabaseUrl!.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: supabasePublishableKey! },
    });

    expect(response.status, `Supabase settings endpoint returned ${response.status}`).toBe(200);
  }, 15_000);
});
