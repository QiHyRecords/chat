import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { FormField, PrimaryButton, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { requestPasswordReset } from "@/lib/chat-api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState(""); const [status, setStatus] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const submit = async () => { setLoading(true); setError(null); const result = await requestPasswordReset(email); setLoading(false); if (result.error) return setError(result.error.message); setStatus("If that email belongs to an account, you will receive a secure reset link shortly."); };
  return <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.grow}><ScreenHeader title="Reset password" onBack={() => router.back()} /><View style={styles.content}><View><Text style={styles.title}>Recover your account</Text><Text style={styles.subtitle}>Enter your account email and we will send a secure password-reset link.</Text></View><View style={styles.form}><FormField label="Email" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" value={email} />{error ? <Text style={styles.error}>{error}</Text> : null}{status ? <Text style={styles.notice}>{status}</Text> : null}<PrimaryButton label="Send reset link" loading={loading} onPress={submit} /></View></View></KeyboardAvoidingView></ScreenContainer>;
}
const styles = StyleSheet.create({ grow: { flex: 1 }, content: { flex: 1, gap: 28, justifyContent: "center", paddingBottom: 80 }, title: { color: "#171B25", fontSize: 28, fontWeight: "900" }, subtitle: { color: "#687086", fontSize: 15, lineHeight: 22, marginTop: 8 }, form: { gap: 16 }, error: { backgroundColor: "#FDF0F0", borderRadius: 12, color: "#B52D2D", padding: 12 }, notice: { backgroundColor: "#EDF8F4", borderRadius: 12, color: "#16704F", lineHeight: 20, padding: 12 } });
