import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, EmptyState, InlineIdentity, PrimaryButton } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { createDirectConversation, listFriends } from "@/lib/chat-api";
import type { Profile } from "@/shared/chat-types";

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    setLoading(true);
    const result = await listFriends();
    setLoading(false);
    if (result.error) return setError(result.error.message);
    setFriends(result.data);
    setError(null);
  };
  const message = async (friend: Profile) => {
    const result = await createDirectConversation(friend.id);
    if (result.error) return setError(result.error.message);
    router.push({ pathname: "/conversation/[id]", params: { id: result.data, title: friend.display_name, kind: "direct", verified: friend.verified ? "true" : "false" } } as never);
  };
  useEffect(() => { void refresh(); }, []);
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <View style={styles.header}><View><Text style={styles.title}>Friends</Text><Text style={styles.subtitle}>People you know on Chat</Text></View><Pressable onPress={() => router.push("/find-people" as never)} style={styles.add}><Text style={styles.addText}>Find people</Text></Pressable></View>
    {loading ? <View style={styles.loader}><ActivityIndicator color="#3858E9" /></View> : null}
    {error ? <EmptyState icon="cloud-off" title="Could not load friends" description={error} action={<PrimaryButton label="Retry" onPress={() => void refresh()} />} /> : null}
    {!loading && !error && !friends.length ? <EmptyState icon="people-outline" title="Build your circle" description="Search for people by name or username, then send a friend request." action={<PrimaryButton icon="person-add" label="Find people" onPress={() => router.push("/find-people" as never)} />} /> : null}
    {!loading && !error && friends.length ? <FlatList contentContainerStyle={styles.list} data={friends} keyExtractor={(item) => item.id} onRefresh={() => void refresh()} refreshing={loading} renderItem={({ item }) => <View style={styles.friend}><Pressable onPress={() => router.push(`/profile/${item.id}` as never)} style={({ pressed }) => [styles.profileTap, pressed && styles.pressed]}><Avatar profile={item} size={48} /><View style={styles.friendInfo}><InlineIdentity label={item.display_name} verified={item.verified} textStyle={styles.name} /><Text style={styles.handle}>@{item.username}</Text></View></Pressable><Pressable onPress={() => void message(item)} style={({ pressed }) => [styles.message, pressed && styles.pressed]}><Text style={styles.messageText}>Message</Text></Pressable></View>} /> : null}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingTop: 15 }, title: { color: "#171B25", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }, subtitle: { color: "#687086", fontSize: 14, marginTop: 5 }, add: { backgroundColor: "#E8EDFF", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }, addText: { color: "#3858E9", fontSize: 13, fontWeight: "900" }, loader: { flex: 1, justifyContent: "center" }, list: { paddingBottom: 20, paddingTop: 12 }, friend: { alignItems: "center", borderBottomColor: "#E9ECF3", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 70 }, profileTap: { alignItems: "center", flex: 1, flexDirection: "row", gap: 11 }, friendInfo: { flex: 1 }, name: { color: "#171B25", fontSize: 16, fontWeight: "800" }, handle: { color: "#687086", fontSize: 12, marginTop: 2 }, message: { backgroundColor: "#E8EDFF", borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 }, messageText: { color: "#3858E9", fontSize: 12, fontWeight: "900" }, pressed: { opacity: 0.7 } });
