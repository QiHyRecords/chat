import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { ClaySurface } from "@/components/clay-ui";
import { FormField, PrimaryButton, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { requestPasswordReset } from "@/lib/chat-api";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const [email, setEmail] = useState(""); const [status, setStatus] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const submit = async () => { setLoading(true); setError(null); const result = await requestPasswordReset(email); setLoading(false); if (result.error) return setError(result.error.message); setStatus("If that email belongs to an account, you will receive a secure reset link shortly."); };
  return <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.grow}><ScreenHeader title="Reset password" onBack={() => router.back()} /><View style={styles.content}><View><Text style={[styles.title, { color: colors.foreground }]}>Recover your account</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Enter your account email and we will send a secure password-reset link.</Text></View><View style={styles.form}><FormField label="Email" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" value={email} />{error ? <ClaySurface radius={18} variant="sunken" style={[styles.feedback, { backgroundColor: colors.error + "18" }]}><Text style={[styles.feedbackText, { color: colors.error }]}>{error}</Text></ClaySurface> : null}{status ? <ClaySurface radius={18} variant="sunken" style={[styles.feedback, { backgroundColor: colors.success + "18" }]}><Text style={[styles.feedbackText, { color: colors.success }]}>{status}</Text></ClaySurface> : null}<PrimaryButton label="Send reset link" loading={loading} onPress={submit} /></View></View></KeyboardAvoidingView></ScreenContainer>;
}
const styles = StyleSheet.create({ grow: { flex: 1 }, content: { flex: 1, gap: 28, justifyContent: "center", paddingBottom: 80 }, title: { fontSize: 28, fontWeight: "900" }, subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 }, form: { gap: 16 }, feedback: { padding: 13 }, feedbackText: { lineHeight: 20 } });
