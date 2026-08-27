import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { ClayPressable, ClaySurface } from "@/components/clay-ui";
import { Avatar, InlineIdentity, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getGroupDetails, inviteToGroup, searchProfiles } from "@/lib/chat-api";
import type { Profile } from "@/shared/chat-types";

export default function GroupInviteScreen() {
  const colors = useColors(); const { id: conversationId } = useLocalSearchParams<{ id: string }>(); const [query, setQuery] = useState(""); const [results, setResults] = useState<Profile[]>([]); const [loading, setLoading] = useState(false); const [status, setStatus] = useState<string | null>(null);
  const search = async (value: string) => { setQuery(value); if (!value.trim()) return setResults([]); setLoading(true); const result = await searchProfiles(value); setLoading(false); if (result.error) return setStatus(result.error.message); setResults(result.data); setStatus(null); };
  const invite = async (candidate: Profile) => { setLoading(true); const group = await getGroupDetails(conversationId); if (group.error) { setLoading(false); return setStatus(group.error.message); } const result = await inviteToGroup(group.data.id, candidate.id); setLoading(false); if (result.error) return setStatus(result.error.message); setStatus(`Invitation sent to ${candidate.display_name}.`); };
  const isSuccess = status?.startsWith("Invitation sent") ?? false;
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="Invite people" onBack={() => router.back()} /><ClaySurface radius={23} variant="sunken" style={styles.search}><TextInput autoCapitalize="none" onChangeText={(value) => void search(value)} placeholder="Name or username" placeholderTextColor={colors.subtle} style={[styles.input, { color: colors.foreground }]} value={query} /></ClaySurface>{loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}{status ? <Text style={[styles.status, { color: isSuccess ? colors.success : colors.error }]}>{status}</Text> : null}<FlatList data={results} contentContainerStyle={styles.list} keyExtractor={(item) => item.id} renderItem={({ item }) => <ClayPressable onPress={() => void invite(item)} radius={22} style={[styles.row, { backgroundColor: colors.elevated }]}><View style={styles.rowContent}><Avatar profile={item} size={46} /><View style={styles.info}><InlineIdentity label={item.display_name} verified={item.verified} textStyle={[styles.name, { color: colors.foreground }]} /><Text style={[styles.handle, { color: colors.muted }]}>@{item.username}</Text></View><Text style={[styles.invite, { color: colors.primary }]}>Invite</Text></View></ClayPressable>} /></ScreenContainer>;
}
const styles = StyleSheet.create({ search: { marginTop: 14, minHeight: 54, paddingHorizontal: 15 }, input: { fontSize: 16, minHeight: 52 }, loader: { marginTop: 14 }, status: { marginTop: 12, textAlign: "center" }, list: { gap: 12, paddingBottom: 25, paddingTop: 14 }, row: { minHeight: 72, paddingHorizontal: 12 }, rowContent: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 72 }, info: { flex: 1 }, name: { fontSize: 15, fontWeight: "800" }, handle: { fontSize: 12, marginTop: 2 }, invite: { fontSize: 13, fontWeight: "900" } });
