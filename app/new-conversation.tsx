import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ClayPressable } from "@/components/clay-ui";
import { ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

function Choice({ icon, title, description, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; description: string; onPress: () => void }) {
  const colors = useColors();
  return <ClayPressable onPress={onPress} radius={25} style={styles.choice}><View style={styles.choiceContent}><View style={[styles.choiceIcon, { backgroundColor: colors.accentSoft }]}><MaterialIcons name={icon} size={24} color={colors.primary} /></View><View style={styles.choiceBody}><Text style={[styles.choiceTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.choiceDescription, { color: colors.muted }]}>{description}</Text></View><MaterialIcons name="chevron-right" size={24} color={colors.muted} /></View></ClayPressable>;
}

export default function NewConversationScreen() {
  const colors = useColors();
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="New conversation" onBack={() => router.back()} /><View style={styles.content}><Text style={[styles.intro, { color: colors.muted }]}>Choose how you would like to connect.</Text><View style={styles.choices}><Choice icon="person-outline" title="Private message" description="Find a person and start a one-to-one conversation." onPress={() => router.push("/find-people" as never)} /><Choice icon="groups-2" title="New group" description="Create a group and invite people to join." onPress={() => router.push("/create-group" as never)} /></View></View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 22 }, intro: { fontSize: 15, lineHeight: 22 }, choices: { gap: 14, marginTop: 22 }, choice: { minHeight: 92, paddingHorizontal: 16 }, choiceContent: { alignItems: "center", flexDirection: "row", gap: 14, minHeight: 92 }, choiceIcon: { alignItems: "center", borderRadius: 17, height: 48, justifyContent: "center", width: 48 }, choiceBody: { flex: 1 }, choiceTitle: { fontSize: 16, fontWeight: "800" }, choiceDescription: { fontSize: 13, lineHeight: 18, marginTop: 4 } });
