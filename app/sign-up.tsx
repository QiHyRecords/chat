import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { ClaySurface } from "@/components/clay-ui";
import { FormField, PrimaryButton, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { signUp } from "@/lib/chat-api";

export default function SignUpScreen() {
  const colors = useColors();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError(null); setNotice(null);
    const result = await signUp({ displayName, username, email, password, confirmPassword });
    setLoading(false);
    if (result.error) return setError(result.error.message);
    if (result.data === "confirmation_required") return setNotice("Check your email to confirm your account, then sign in.");
    router.replace("/(tabs)" as never);
  };

  return (
    <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.grow}>
        <ScreenHeader title="Create account" onBack={() => router.back()} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View><Text style={[styles.title, { color: colors.foreground }]}>Start a conversation</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Your username is unique. Your display name can be anything that feels like you.</Text></View>
          <View style={styles.form}>
            <FormField label="Display name" autoComplete="name" onChangeText={setDisplayName} placeholder="Morgan Reyes" value={displayName} />
            <FormField label="Username" autoCapitalize="none" onChangeText={setUsername} placeholder="morgan_reyes" value={username} />
            <FormField label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" value={email} />
            <FormField label="Password" autoComplete="new-password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} />
            <FormField label="Confirm password" autoComplete="new-password" onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry value={confirmPassword} />
            {error ? <ClaySurface radius={18} variant="sunken" style={[styles.noticeSurface, { backgroundColor: colors.error + "1A" }]}><Text accessibilityRole="alert" style={[styles.noticeText, { color: colors.error }]}>{error}</Text></ClaySurface> : null}
            {notice ? <ClaySurface radius={18} variant="sunken" style={[styles.noticeSurface, { backgroundColor: colors.success + "1A" }]}><Text accessibilityRole="alert" style={[styles.noticeText, { color: colors.success }]}>{notice}</Text></ClaySurface> : null}
            <PrimaryButton label="Create account" loading={loading} onPress={submit} />
          </View>
          <Text onPress={() => router.replace("/sign-in" as never)} style={[styles.link, { color: colors.primary }]}>Already have an account? Sign in</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ grow: { flex: 1 }, content: { gap: 26, paddingBottom: 42, paddingTop: 20 }, title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }, subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 }, form: { gap: 16 }, noticeSurface: { padding: 13 }, noticeText: { fontSize: 14, lineHeight: 20 }, link: { fontSize: 15, fontWeight: "800", paddingBottom: 10, textAlign: "center" } });
