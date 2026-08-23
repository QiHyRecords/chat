import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { Avatar, FullScreenLoader, PrimaryButton, ScreenHeader, SecondaryButton } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getGroupInviteDetails, respondToGroupInvite } from "@/lib/chat-api";

export default function GroupInvitationScreen() {
  const colors = useColors(); const { id } = useLocalSearchParams<{ id: string }>(); const [invite, setInvite] = useState<Awaited<ReturnType<typeof getGroupInviteDetails>>["data"]>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [working, setWorking] = useState(false);
  const refresh = async () => { setLoading(true); const result = await getGroupInviteDetails(id); setLoading(false); if (result.error) { setError(result.error.message); return; } setInvite(result.data); setError(null); };
  useEffect(() => { void refresh(); }, [id]);
  const respond = async (accept: boolean) => { setWorking(true); const result = await respondToGroupInvite(id, accept); setWorking(false); if (result.error) return Alert.alert("Invitation unavailable", result.error.message); if (accept && invite) { router.replace({ pathname: "/conversation/[id]", params: { id: invite.conversation_id, title: invite.group_name, kind: "group" } } as never); return; } router.back(); };
  if (loading) return <FullScreenLoader label="Opening invitation" />;
  if (!invite || error) return <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="Group invitation" onBack={() => router.back()} /><View style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Invitation unavailable</Text><Text style={[styles.emptyText, { color: colors.muted }]}>{error ?? "This invitation may have been withdrawn or already answered."}</Text></View></ScreenContainer>;
  return <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="Group invitation" onBack={() => router.back()} /><View style={styles.content}><View style={[styles.card, { backgroundColor: colors.elevated, borderColor: colors.border }]}><Avatar profile={{ avatar_path: invite.group_avatar_path, display_name: invite.group_name }} size={80} /><Text style={[styles.name, { color: colors.foreground }]}>{invite.group_name}</Text><Text style={[styles.copy, { color: colors.muted }]}>You were invited to join this group by {invite.inviter_name} (@{invite.inviter_username}).</Text></View>{invite.invite_status === "pending" ? <View style={styles.actions}><PrimaryButton disabled={working} label="Accept invitation" loading={working} onPress={() => void respond(true)} /><SecondaryButton disabled={working} label="Decline" onPress={() => void respond(false)} /></View> : <Text style={[styles.status, { color: colors.muted }]}>This invitation has already been {invite.invite_status}.</Text>}</View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { flex: 1, gap: 20, paddingTop: 26 }, card: { alignItems: "center", borderRadius: 20, borderWidth: 1, gap: 10, padding: 24 }, name: { fontSize: 23, fontWeight: "900", marginTop: 5, textAlign: "center" }, copy: { fontSize: 14, lineHeight: 21, textAlign: "center" }, actions: { gap: 10 }, status: { fontSize: 14, lineHeight: 20, textAlign: "center" }, empty: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 25 }, emptyTitle: { fontSize: 20, fontWeight: "900", textAlign: "center" }, emptyText: { fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" } });
