import themeConfig from "../theme.config";
import { describe, expect, it } from "vitest";

type Scheme = "light" | "dark";
const palette = themeConfig.themeColors;

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string) {
  const [high, low] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

function color(name: keyof typeof palette, scheme: Scheme) { return palette[name][scheme]; }

describe("Chat semantic color contrast", () => {
  const textTokens = ["foreground", "muted", "subtle", "primary", "success", "warning", "error"] as const;
  const surfaces = ["background", "surface", "elevated"] as const;

  for (const scheme of ["light", "dark"] as const) {
    it(`${scheme} text tokens meet AA on all primary surfaces`, () => {
      for (const text of textTokens) for (const surface of surfaces) expect(contrast(color(text, scheme), color(surface, scheme)), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    });

    it(`${scheme} control foregrounds and semantic fills meet AA`, () => {
      expect(contrast(color("onPrimary", scheme), color("primary", scheme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("onError", scheme), color("error", scheme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("foreground", scheme), color("accentSoft", scheme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("primary", scheme), color("accentSoft", scheme))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color("onPrimary", scheme), color("muted", scheme))).toBeGreaterThanOrEqual(4.5);
    });

    it(`${scheme} input and card boundaries meet non-text contrast`, () => {
      for (const surface of surfaces) expect(contrast(color("border", scheme), color(surface, scheme)), `border on ${surface}`).toBeGreaterThanOrEqual(3);
    });
  }
});
