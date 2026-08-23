import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton, ScreenHeader, SecondaryButton } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { requestAccountDeletion } from "@/lib/chat-api";

export default function RequestDeletionScreen() {
  const [loading, setLoading] = useState(false); const [status, setStatus] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const submit = async () => { setLoading(true); setError(null); const result = await requestAccountDeletion(); setLoading(false); if (result.error) return setError(result.error.message.includes("duplicate") ? "A deletion request is already pending for this account." : result.error.message); setStatus("Your request is recorded securely. A trusted administrator will process it according to the account-deletion policy."); };
  return <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="Delete account" onBack={() => router.back()} /><View style={styles.content}><View><Text style={styles.title}>Request account deletion</Text><Text style={styles.copy}>This creates a secure deletion request. It does not immediately remove your account, messages, or media while a request is being processed.</Text></View>{error ? <Text style={styles.error}>{error}</Text> : null}{status ? <View style={styles.status}><Text style={styles.statusText}>{status}</Text><SecondaryButton label="Back to account" onPress={() => router.replace("/(tabs)/account" as never)} /></View> : <View style={styles.actions}><PrimaryButton label="Submit deletion request" loading={loading} onPress={submit} /><SecondaryButton label="Keep my account" onPress={() => router.back()} /></View>}</View></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { flex: 1, gap: 28, justifyContent: "center", paddingBottom: 100 }, title: { color: "#171B25", fontSize: 27, fontWeight: "900" }, copy: { color: "#596176", fontSize: 15, lineHeight: 23, marginTop: 10 }, actions: { gap: 10 }, error: { backgroundColor: "#FDF0F0", borderRadius: 12, color: "#B52D2D", lineHeight: 20, padding: 12 }, status: { backgroundColor: "#EDF8F4", borderRadius: 14, gap: 14, padding: 15 }, statusText: { color: "#16704F", lineHeight: 21 } });
