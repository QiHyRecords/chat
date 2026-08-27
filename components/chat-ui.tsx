import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, type StyleProp, type TextInputProps, type TextStyle, View } from "react-native";

import { ClayPressable, ClaySurface, useClayStyles } from "@/components/clay-ui";
import { useColors } from "@/hooks/use-colors";
import { getAvatarUrl } from "@/lib/supabase";
import type { Badge, Profile } from "@/shared/chat-types";

export function Avatar({ profile, size = 44 }: { profile?: Pick<Profile, "avatar_path" | "display_name"> | null; size?: number }) {
  const colors = useColors();
  const clay = useClayStyles();
  const uri = getAvatarUrl(profile?.avatar_path);
  return uri ? <View style={[styles.avatarShell, clay.raised, { width: size, height: size, borderRadius: size / 2 }]}><Image source={uri} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft }]} contentFit="cover" /></View> : <View style={[styles.avatarFallback, clay.raised, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft }]}><Text style={[styles.avatarText, { color: colors.primary, fontSize: Math.max(14, size * 0.38) }]}>{profile?.display_name?.trim().slice(0, 1).toUpperCase() || "?"}</Text></View>;
}

const BADGE_CONFIG: Record<Badge, { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; tone: "warning" | "primary" }> = {
  OWNER: { icon: "workspace-premium", label: "Owner", tone: "warning" },
  ADMIN: { icon: "shield", label: "Admin", tone: "primary" },
  DEV: { icon: "code", label: "Developer", tone: "primary" },
};

export function BadgeRow({ badges }: { badges?: Badge[] | null }) {
  const colors = useColors();
  const clay = useClayStyles();
  const privilegeBadges = (badges ?? []).filter((badge) => ["OWNER", "ADMIN", "DEV"].includes(String(badge))) as Badge[];
  if (!privilegeBadges.length) return null;
  return <View accessibilityLabel={`Account badges: ${privilegeBadges.map((badge) => BADGE_CONFIG[badge].label).join(", ")}`} style={[styles.badgeRow, clay.sunken, { backgroundColor: colors.accentSoft }]}>{privilegeBadges.map((badge) => { const config = BADGE_CONFIG[badge]; return <MaterialIcons key={badge} name={config.icon} color={colors[config.tone]} size={16} accessibilityLabel={config.label} />; })}</View>;
}

export function InlineIdentity({ label, verified, numberOfLines = 1, textStyle, accessibilityLabel }: { label: string; verified?: boolean; numberOfLines?: number; textStyle?: StyleProp<TextStyle>; accessibilityLabel?: string }) {
  const colors = useColors();
  return <View accessibilityLabel={accessibilityLabel ?? (verified ? `${label}, verified` : label)} style={styles.identityRow}><Text numberOfLines={numberOfLines} style={[styles.identityText, { color: colors.foreground }, textStyle]}>{label}</Text>{verified ? <MaterialIcons accessibilityLabel="Verified account" name="verified" color={colors.success} size={15} style={styles.verifiedIcon} /> : null}</View>;
}

export function PrimaryButton({ label, onPress, loading, disabled, icon }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  const colors = useColors();
  return <ClayPressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} radius={24} style={[styles.primaryButton, { backgroundColor: disabled || loading ? colors.subtle : colors.primary }]}>{loading ? <ActivityIndicator color={colors.onPrimary} /> : <View style={styles.buttonContent}>{icon ? <MaterialIcons name={icon} size={20} color={colors.onPrimary} /> : null}<Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{label}</Text></View>}</ClayPressable>;
}

export function SecondaryButton({ label, onPress, destructive = false, disabled = false, icon }: { label: string; onPress: () => void; destructive?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  const colors = useColors();
  const color = disabled ? colors.muted : destructive ? colors.error : colors.primary;
  return <ClayPressable accessibilityRole="button" disabled={disabled} onPress={onPress} radius={22} style={[styles.secondaryButton, { backgroundColor: disabled ? colors.elevated : colors.surface }]}><View style={styles.buttonContent}>{icon ? <MaterialIcons name={icon} size={20} color={color} /> : null}<Text style={[styles.secondaryButtonText, { color }]}>{label}</Text></View></ClayPressable>;
}

export function FormField({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return <View style={styles.fieldWrap}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><ClaySurface radius={21} variant="sunken" style={error ? { shadowColor: colors.error, shadowOpacity: 0.38 } : undefined}><TextInput accessibilityLabel={label} placeholderTextColor={colors.subtle} style={[styles.input, { color: colors.foreground }]} {...props} /></ClaySurface>{error ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: colors.error }]}>{error}</Text> : null}</View>;
}

export function ScreenHeader({ title, subtitle, onBack, action }: { title: string; subtitle?: string; onBack?: () => void; action?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.header}>{onBack ? <Pressable accessibilityLabel="Go back" onPress={onBack} style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></Pressable> : <View style={styles.headerSpacer} />}<View style={styles.headerText}><Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>{subtitle ? <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{subtitle}</Text> : null}</View>{action ?? <View style={styles.headerSpacer} />}</View>;
}

export function EmptyState({ icon, title, description, action }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; description: string; action?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.emptyState}><View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}><MaterialIcons name={icon} size={30} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDescription, { color: colors.muted }]}>{description}</Text>{action ? <View style={styles.emptyAction}>{action}</View> : null}</View>;
}

export function FullScreenLoader({ label = "Loading Chat" }: { label?: string }) {
  const colors = useColors();
  return <View style={[styles.loader, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loaderText, { color: colors.muted }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  avatar: {}, avatarShell: { overflow: "visible" }, avatarFallback: { alignItems: "center", justifyContent: "center" }, avatarText: { fontWeight: "800" }, identityRow: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 3, minWidth: 0 }, identityText: { flexShrink: 1 }, verifiedIcon: { flexShrink: 0 }, badgeRow: { alignItems: "center", alignSelf: "flex-start", borderRadius: 14, flexDirection: "row", gap: 6, paddingHorizontal: 9, paddingVertical: 6 }, primaryButton: { minHeight: 54, paddingHorizontal: 18 }, buttonContent: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" }, primaryButtonText: { fontSize: 16, fontWeight: "800" }, secondaryButton: { minHeight: 50, paddingHorizontal: 16 }, secondaryButtonText: { fontSize: 15, fontWeight: "800" }, fieldWrap: { gap: 8 }, fieldLabel: { fontSize: 14, fontWeight: "800" }, input: { backgroundColor: "transparent", borderRadius: 21, fontSize: 16, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 }, fieldError: { fontSize: 13, fontWeight: "600" }, header: { alignItems: "center", flexDirection: "row", minHeight: 56 }, headerSpacer: { width: 44 }, iconButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 }, iconPressed: { opacity: 0.62, transform: [{ scale: 0.96 }] }, headerText: { alignItems: "center", flex: 1 }, headerTitle: { fontSize: 18, fontWeight: "800" }, headerSubtitle: { fontSize: 12, marginTop: 2 }, emptyState: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 34 }, emptyIcon: { alignItems: "center", borderRadius: 24, height: 58, justifyContent: "center", width: 58 }, emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: 18, textAlign: "center" }, emptyDescription: { fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: "center" }, emptyAction: { alignSelf: "stretch", marginTop: 22 }, loader: { alignItems: "center", flex: 1, justifyContent: "center", gap: 12 }, loaderText: { fontSize: 15, fontWeight: "600" },
});
