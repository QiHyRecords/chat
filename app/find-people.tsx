import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { ClayPressable, ClaySurface } from "@/components/clay-ui";
import { Avatar, InlineIdentity, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { searchProfiles } from "@/lib/chat-api";
import { useChatAuth } from "@/providers/chat-auth-provider";
import type { Profile } from "@/shared/chat-types";

export default function FindPeopleScreen() {
  const colors = useColors();
  const { profile: currentProfile } = useChatAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (value = query) => {
    setQuery(value);
    if (!value.trim()) { setResults([]); setError(null); return; }
    setLoading(true); setError(null);
    const result = await searchProfiles(value);
    setLoading(false);
    if (result.error) return setError(result.error.message);
    setResults(result.data.filter((candidate) => candidate.id !== currentProfile?.id));
  };

  return (
    <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}>
      <ScreenHeader title="Find people" onBack={() => router.back()} />
      <ClaySurface radius={24} variant="sunken" style={styles.search} contentStyle={styles.searchContent}>
        <MaterialIcons name="search" size={21} color={colors.muted} />
        <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={(value) => void search(value)} placeholder="Name or username" placeholderTextColor={colors.subtle} style={[styles.input, { color: colors.foreground }]} value={query} />
      </ClaySurface>
      {loading ? <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View> : null}
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      <FlatList
        contentContainerStyle={results.length ? styles.list : styles.emptyList}
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!loading && query.trim() ? <Text style={[styles.empty, { color: colors.muted }]}>No people found. Try another name or username.</Text> : <Text style={[styles.empty, { color: colors.muted }]}>Search Chat by display name or username.</Text>}
        renderItem={({ item }) => (
          <ClayPressable onPress={() => router.push(`/profile/${item.id}` as never)} radius={24} style={styles.result}>
            <View style={styles.resultContent}>
              <Avatar profile={item} size={48} />
              <View style={styles.resultText}>
                <InlineIdentity label={item.display_name} verified={item.verified} textStyle={[styles.name, { color: colors.foreground }]} />
                <Text style={[styles.username, { color: colors.muted }]}>@{item.username}</Text>
                {item.bio ? <Text numberOfLines={1} style={[styles.bio, { color: colors.subtle }]}>{item.bio}</Text> : null}
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
            </View>
          </ClayPressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  search: { marginTop: 12, minHeight: 54 },
  searchContent: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 54, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, minHeight: 52 },
  list: { gap: 12, paddingBottom: 34, paddingTop: 16 },
  emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 80 },
  empty: { fontSize: 15, lineHeight: 22, paddingHorizontal: 30, textAlign: "center" },
  loader: { marginTop: 16 },
  error: { fontSize: 13, fontWeight: "700", marginTop: 14 },
  result: { minHeight: 76, paddingHorizontal: 15 },
  resultContent: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 76 },
  resultText: { flex: 1 },
  name: { fontSize: 16, fontWeight: "800" },
  username: { fontSize: 13, marginTop: 2 },
  bio: { fontSize: 12, marginTop: 3 },
});
