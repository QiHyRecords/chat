import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";

function Choice({ icon, title, description, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; description: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}><View style={styles.choiceIcon}><MaterialIcons name={icon} size={24} color="#3858E9" /></View><View style={styles.choiceBody}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceDescription}>{description}</Text></View><MaterialIcons name="chevron-right" size={24} color="#98A1B3" /></Pressable>;
}

export default function NewConversationScreen() {
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="New conversation" onBack={() => router.back()} /><View style={styles.content}><Text style={styles.intro}>Choose how you would like to connect.</Text><View style={styles.choices}><Choice icon="person-outline" title="Private message" description="Find a person and start a one-to-one conversation." onPress={() => router.push("/find-people" as never)} /><Choice icon="groups-2" title="New group" description="Create a group and invite people to join." onPress={() => router.push("/create-group" as never)} /></View></View></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 20 }, intro: { color: "#687086", fontSize: 15, lineHeight: 22 }, choices: { backgroundColor: "#FFFFFF", borderColor: "#E4E7EF", borderRadius: 18, borderWidth: 1, marginTop: 20, overflow: "hidden" }, choice: { alignItems: "center", borderBottomColor: "#EEF0F5", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 13, minHeight: 88, paddingHorizontal: 14 }, choiceIcon: { alignItems: "center", backgroundColor: "#E8EDFF", borderRadius: 13, height: 44, justifyContent: "center", width: 44 }, choiceBody: { flex: 1 }, choiceTitle: { color: "#171B25", fontSize: 16, fontWeight: "800" }, choiceDescription: { color: "#687086", fontSize: 13, lineHeight: 18, marginTop: 4 }, pressed: { backgroundColor: "#F7F8FC" } });
