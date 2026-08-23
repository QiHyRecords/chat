import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="Invite people" onBack={() => router.back()} /><View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput autoCapitalize="none" onChangeText={(value) => void search(value)} placeholder="Name or username" placeholderTextColor={colors.subtle} style={[styles.input, { color: colors.foreground }]} value={query} /></View>{loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}{status ? <Text style={[styles.status, { color: isSuccess ? colors.success : colors.error }]}>{status}</Text> : null}<FlatList data={results} contentContainerStyle={styles.list} keyExtractor={(item) => item.id} renderItem={({ item }) => <Pressable onPress={() => void invite(item)} style={({ pressed }) => [styles.row, { backgroundColor: colors.elevated, borderColor: colors.border }, pressed && styles.pressed]}><Avatar profile={item} size={46} /><View style={styles.info}><InlineIdentity label={item.display_name} verified={item.verified} textStyle={[styles.name, { color: colors.foreground }]} /><Text style={[styles.handle, { color: colors.muted }]}>@{item.username}</Text></View><Text style={[styles.invite, { color: colors.primary }]}>Invite</Text></Pressable>} /></ScreenContainer>;
}
const styles = StyleSheet.create({ search: { borderRadius: 14, borderWidth: 1, marginTop: 14, minHeight: 52, paddingHorizontal: 14 }, input: { fontSize: 16, minHeight: 50 }, loader: { marginTop: 14 }, status: { marginTop: 12, textAlign: "center" }, list: { gap: 8, paddingBottom: 25, paddingTop: 10 }, row: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 66, paddingHorizontal: 10 }, info: { flex: 1 }, name: { fontSize: 15, fontWeight: "800" }, handle: { fontSize: 12, marginTop: 2 }, invite: { fontSize: 13, fontWeight: "900" }, pressed: { opacity: 0.72 } });
