import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ClaySurface } from "@/components/clay-ui";
import { PrimaryButton, ScreenHeader, SecondaryButton } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { requestAccountDeletion } from "@/lib/chat-api";

export default function RequestDeletionScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false); const [status, setStatus] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const submit = async () => { setLoading(true); setError(null); const result = await requestAccountDeletion(); setLoading(false); if (result.error) return setError(result.error.message.includes("duplicate") ? "A deletion request is already pending for this account." : result.error.message); setStatus("Your request is recorded securely. A trusted administrator will process it according to the account-deletion policy."); };
  return <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}><ScreenHeader title="Delete account" onBack={() => router.back()} /><View style={styles.content}><View><Text style={[styles.title, { color: colors.foreground }]}>Request account deletion</Text><Text style={[styles.copy, { color: colors.muted }]}>This creates a secure deletion request. It does not immediately remove your account, messages, or media while a request is being processed.</Text></View>{error ? <ClaySurface radius={20} variant="sunken" style={[styles.feedback, { backgroundColor: colors.error + "18" }]}><Text style={[styles.feedbackText, { color: colors.error }]}>{error}</Text></ClaySurface> : null}{status ? <ClaySurface radius={22} style={[styles.status, { backgroundColor: colors.elevated }]}><Text style={[styles.statusText, { color: colors.success }]}>{status}</Text><SecondaryButton label="Back to account" onPress={() => router.replace("/(tabs)/account" as never)} /></ClaySurface> : <View style={styles.actions}><PrimaryButton label="Submit deletion request" loading={loading} onPress={submit} /><SecondaryButton label="Keep my account" onPress={() => router.back()} /></View>}</View></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { flex: 1, gap: 28, justifyContent: "center", paddingBottom: 100 }, title: { fontSize: 27, fontWeight: "900" }, copy: { fontSize: 15, lineHeight: 23, marginTop: 10 }, actions: { gap: 12 }, feedback: { padding: 14 }, feedbackText: { lineHeight: 20 }, status: { gap: 14, padding: 17 }, statusText: { lineHeight: 21 } });
