import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useClayStyles } from "@/components/clay-ui";
import { PrimaryButton, SecondaryButton } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function WelcomeScreen() {
  const colors = useColors();
  const clay = useClayStyles();
  return (
    <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
      <View style={styles.page}>
        <View style={[styles.mark, clay.elevated, { backgroundColor: colors.elevated }]}><View style={[styles.bubblePrimary, { backgroundColor: colors.primary }]} /><View style={[styles.bubbleSecondary, { backgroundColor: colors.primary }]} /></View>
        <View style={[styles.copy, clay.raised, { backgroundColor: colors.elevated }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Chat</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>A focused space for private conversations and the groups that matter to you.</Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Create account" onPress={() => router.push("/sign-up" as never)} />
          <SecondaryButton label="Sign in" onPress={() => router.push("/sign-in" as never)} />
          <Text style={[styles.footnote, { color: colors.subtle }]}>Your messages and media are protected by account-based access rules.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "space-between", paddingBottom: 14, paddingTop: 42 },
  mark: { alignSelf: "center", borderRadius: 40, height: 124, position: "relative", width: 124 },
  bubblePrimary: { borderRadius: 38, height: 82, left: 6, opacity: 0.95, position: "absolute", top: 13, transform: [{ rotate: "-10deg" }], width: 88 },
  bubbleSecondary: { borderRadius: 34, bottom: 9, height: 65, opacity: 0.72, position: "absolute", right: 5, transform: [{ rotate: "9deg" }], width: 72 },
  copy: { borderRadius: 28, gap: 13, padding: 22 },
  title: { fontSize: 38, fontWeight: "900", letterSpacing: -1.2, textAlign: "center" },
  subtitle: { fontSize: 17, lineHeight: 25, textAlign: "center" },
  actions: { gap: 13 },
  footnote: { fontSize: 12, lineHeight: 17, marginTop: 8, textAlign: "center" },
});
