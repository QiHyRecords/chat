import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, type StyleProp, type TextInputProps, type TextStyle, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { getAvatarUrl } from "@/lib/supabase";
import type { Badge, Profile } from "@/shared/chat-types";

export function Avatar({ profile, size = 44 }: { profile?: Pick<Profile, "avatar_path" | "display_name"> | null; size?: number }) {
  const colors = useColors();
  const uri = getAvatarUrl(profile?.avatar_path);
  return uri ? <Image source={uri} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft }]} contentFit="cover" /> : <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft }]}><Text style={[styles.avatarText, { color: colors.primary, fontSize: Math.max(14, size * 0.38) }]}>{profile?.display_name?.trim().slice(0, 1).toUpperCase() || "?"}</Text></View>;
}

const BADGE_CONFIG: Record<Badge, { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; tone: "warning" | "primary" }> = {
  OWNER: { icon: "workspace-premium", label: "Owner", tone: "warning" },
  ADMIN: { icon: "shield", label: "Admin", tone: "primary" },
  DEV: { icon: "code", label: "Developer", tone: "primary" },
};

export function BadgeRow({ badges }: { badges?: Badge[] | null }) {
  const colors = useColors();
  const privilegeBadges = (badges ?? []).filter((badge) => ["OWNER", "ADMIN", "DEV"].includes(String(badge))) as Badge[];
  if (!privilegeBadges.length) return null;
  return <View accessibilityLabel={`Account badges: ${privilegeBadges.map((badge) => BADGE_CONFIG[badge].label).join(", ")}`} style={[styles.badgeRow, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>{privilegeBadges.map((badge) => { const config = BADGE_CONFIG[badge]; return <MaterialIcons key={badge} name={config.icon} color={colors[config.tone]} size={16} accessibilityLabel={config.label} />; })}</View>;
}

export function InlineIdentity({ label, verified, numberOfLines = 1, textStyle, accessibilityLabel }: { label: string; verified?: boolean; numberOfLines?: number; textStyle?: StyleProp<TextStyle>; accessibilityLabel?: string }) {
  const colors = useColors();
  return <View accessibilityLabel={accessibilityLabel ?? (verified ? `${label}, verified` : label)} style={styles.identityRow}><Text numberOfLines={numberOfLines} style={[styles.identityText, { color: colors.foreground }, textStyle]}>{label}</Text>{verified ? <MaterialIcons accessibilityLabel="Verified account" name="verified" color={colors.success} size={15} style={styles.verifiedIcon} /> : null}</View>;
}

export function PrimaryButton({ label, onPress, loading, disabled, icon }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  const colors = useColors();
  return <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: disabled || loading ? colors.subtle : colors.primary }, pressed && !disabled && !loading && styles.buttonPressed]}>{loading ? <ActivityIndicator color={colors.onPrimary} /> : <>{icon ? <MaterialIcons name={icon} size={20} color={colors.onPrimary} /> : null}<Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{label}</Text></>}</Pressable>;
}

export function SecondaryButton({ label, onPress, destructive = false, disabled = false, icon }: { label: string; onPress: () => void; destructive?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  const colors = useColors();
  const color = disabled ? colors.muted : destructive ? colors.error : colors.primary;
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, { backgroundColor: disabled ? colors.elevated : colors.surface, borderColor: destructive ? colors.error : colors.border }, pressed && !disabled && styles.buttonPressed]}>{icon ? <MaterialIcons name={icon} size={20} color={color} /> : null}<Text style={[styles.secondaryButtonText, { color }]}>{label}</Text></Pressable>;
}

export function FormField({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return <View style={styles.fieldWrap}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.subtle} style={[styles.input, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border, color: colors.foreground }]} {...props} />{error ? <Text accessibilityRole="alert" style={[styles.fieldError, { color: colors.error }]}>{error}</Text> : null}</View>;
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
  avatar: {}, avatarFallback: { alignItems: "center", justifyContent: "center" }, avatarText: { fontWeight: "800" }, identityRow: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 3, minWidth: 0 }, identityText: { flexShrink: 1 }, verifiedIcon: { flexShrink: 0 }, badgeRow: { alignItems: "center", alignSelf: "flex-start", borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 6, paddingHorizontal: 8, paddingVertical: 5 }, primaryButton: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 }, primaryButtonText: { fontSize: 16, fontWeight: "800" }, secondaryButton: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 48, paddingHorizontal: 16 }, secondaryButtonText: { fontSize: 15, fontWeight: "800" }, buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] }, fieldWrap: { gap: 7 }, fieldLabel: { fontSize: 14, fontWeight: "800" }, input: { borderRadius: 14, borderWidth: 1, fontSize: 16, minHeight: 52, paddingHorizontal: 15, paddingVertical: 12 }, fieldError: { fontSize: 13, fontWeight: "600" }, header: { alignItems: "center", flexDirection: "row", minHeight: 56 }, headerSpacer: { width: 44 }, iconButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 }, iconPressed: { opacity: 0.62 }, headerText: { alignItems: "center", flex: 1 }, headerTitle: { fontSize: 18, fontWeight: "800" }, headerSubtitle: { fontSize: 12, marginTop: 2 }, emptyState: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 34 }, emptyIcon: { alignItems: "center", borderRadius: 22, height: 56, justifyContent: "center", width: 56 }, emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: 18, textAlign: "center" }, emptyDescription: { fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: "center" }, emptyAction: { alignSelf: "stretch", marginTop: 22 }, loader: { alignItems: "center", flex: 1, justifyContent: "center", gap: 12 }, loaderText: { fontSize: 15, fontWeight: "600" },
});
