const palette = {
  light: { primary: "#1D63E9", onPrimary: "#FFFFFF", background: "#F7F9FC", surface: "#FFFFFF", elevated: "#FFFFFF", foreground: "#111827", muted: "#45556C", subtle: "#596B86", border: "#7C8DA5", accentSoft: "#EAF0FF", success: "#0F6B4B", warning: "#8A4B00", error: "#B4233B" },
  dark: { primary: "#AFC0FF", onPrimary: "#0B1738", background: "#0A1020", surface: "#111A2E", elevated: "#17233A", foreground: "#F8FAFF", muted: "#C4D0E6", subtle: "#A9B8D2", border: "#7080A0", accentSoft: "#26375E", success: "#76E1B8", warning: "#FFD08A", error: "#FFB4B8" },
};

function rgb(hex) { const value = hex.slice(1); return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255); }
function luminance(hex) { return rgb(hex).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0); }
function contrast(a, b) { const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (high + 0.05) / (low + 0.05); }

const backgrounds = ["background", "surface", "elevated"];
const text = ["foreground", "muted", "subtle", "primary", "success", "warning", "error"];
for (const scheme of Object.keys(palette)) {
  console.log(`\n${scheme.toUpperCase()} MODE`);
  for (const foreground of text) for (const background of backgrounds) console.log(`${foreground} on ${background}: ${contrast(palette[scheme][foreground], palette[scheme][background]).toFixed(2)}:1`);
  console.log(`onPrimary on primary: ${contrast(palette[scheme].onPrimary, palette[scheme].primary).toFixed(2)}:1`);
  console.log(`foreground on accentSoft: ${contrast(palette[scheme].foreground, palette[scheme].accentSoft).toFixed(2)}:1`);
  console.log(`primary on accentSoft: ${contrast(palette[scheme].primary, palette[scheme].accentSoft).toFixed(2)}:1`);
}
