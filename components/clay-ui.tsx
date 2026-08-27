import { type ReactNode, useMemo } from "react";
import { Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/use-colors";

export type ClayVariant = "raised" | "elevated" | "sunken";

/**
 * Shared clay elevation treatment. Android uses elevation for a restrained lower-right
 * cast shadow; iOS receives the matching native shadow plus a separate light-facing layer.
 */
export function useClayStyles() {
  const colors = useColors();
  return useMemo(() => {
    const base: ViewStyle = {
      backgroundColor: colors.surface,
      elevation: 5,
      shadowColor: colors.clayShadow,
      shadowOffset: { width: 7, height: 8 },
      shadowOpacity: Platform.OS === "ios" ? 0.28 : 0.2,
      shadowRadius: 14,
    };
    return {
      raised: base,
      elevated: { ...base, backgroundColor: colors.elevated, elevation: 9, shadowOpacity: Platform.OS === "ios" ? 0.34 : 0.26, shadowRadius: 20 },
      sunken: { backgroundColor: colors.background, elevation: 1, shadowColor: colors.clayShadow, shadowOffset: { width: 3, height: 4 }, shadowOpacity: Platform.OS === "ios" ? 0.2 : 0.12, shadowRadius: 7 },
      highlight: { backgroundColor: colors.clayHighlight, shadowColor: colors.clayHighlight, shadowOffset: { width: -5, height: -5 }, shadowOpacity: Platform.OS === "ios" ? 0.7 : 0, shadowRadius: 12 },
      pressed: { elevation: 1, opacity: 0.93, transform: [{ scale: 0.98 }], shadowOffset: { width: 2, height: 3 }, shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.1, shadowRadius: 5 },
    } satisfies Record<"raised" | "elevated" | "sunken" | "highlight" | "pressed", ViewStyle>;
  }, [colors]);
}

export function ClaySurface({ children, style, contentStyle, radius = 24, variant = "raised" }: { children: ReactNode; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; radius?: number; variant?: ClayVariant }) {
  const clay = useClayStyles();
  const isSunken = variant === "sunken";
  return (
    <View style={[styles.surface, clay[variant], { borderRadius: radius }, style]}>
      {!isSunken ? <View pointerEvents="none" style={[styles.lightFace, clay.highlight, { borderRadius: radius }]} /> : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function ClayPressable({ children, style, variant = "raised", radius = 22, disabled, ...props }: Omit<PressableProps, "style" | "children"> & { children: ReactNode; style?: StyleProp<ViewStyle>; variant?: ClayVariant; radius?: number }) {
  const clay = useClayStyles();
  const isSunken = variant === "sunken";
  return (
    <Pressable disabled={disabled} {...props} style={({ pressed }) => [styles.pressable, clay[variant], { borderRadius: radius }, style, pressed && !disabled && clay.pressed, disabled && styles.disabled]}>
      {!isSunken ? <View pointerEvents="none" style={[styles.lightFace, clay.highlight, { borderRadius: radius }]} /> : null}
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: "visible" },
  pressable: { overflow: "visible" },
  lightFace: { ...StyleSheet.absoluteFillObject, opacity: 0.34 },
  content: { minWidth: 0 },
  disabled: { elevation: 0, opacity: 0.56, shadowOpacity: 0 },
});
