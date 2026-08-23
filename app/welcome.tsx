import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton, SecondaryButton } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";

export default function WelcomeScreen() {
  return (
    <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.mark}><View style={styles.bubblePrimary} /><View style={styles.bubbleSecondary} /></View>
        <View style={styles.copy}>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>A focused space for private conversations and the groups that matter to you.</Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Create account" onPress={() => router.push("/sign-up" as never)} />
          <SecondaryButton label="Sign in" onPress={() => router.push("/sign-in" as never)} />
          <Text style={styles.footnote}>Your messages and media are protected by account-based access rules.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "space-between", paddingBottom: 14, paddingTop: 42 },
  mark: { alignSelf: "center", height: 124, position: "relative", width: 124 },
  bubblePrimary: { backgroundColor: "#3858E9", borderRadius: 38, height: 82, left: 6, position: "absolute", top: 13, transform: [{ rotate: "-10deg" }], width: 88 },
  bubbleSecondary: { backgroundColor: "#7048E8", borderRadius: 34, bottom: 9, height: 65, position: "absolute", right: 5, transform: [{ rotate: "9deg" }], width: 72 },
  copy: { gap: 13 },
  title: { color: "#171B25", fontSize: 38, fontWeight: "900", letterSpacing: -1.2, textAlign: "center" },
  subtitle: { color: "#596176", fontSize: 17, lineHeight: 25, textAlign: "center" },
  actions: { gap: 13 },
  footnote: { color: "#7C8497", fontSize: 12, lineHeight: 17, marginTop: 8, textAlign: "center" },
});
