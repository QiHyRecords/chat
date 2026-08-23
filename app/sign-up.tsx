import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { FormField, PrimaryButton, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { signUp } from "@/lib/chat-api";

export default function SignUpScreen() {
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
          <View><Text style={styles.title}>Start a conversation</Text><Text style={styles.subtitle}>Your username is unique. Your display name can be anything that feels like you.</Text></View>
          <View style={styles.form}>
            <FormField label="Display name" autoComplete="name" onChangeText={setDisplayName} placeholder="Morgan Reyes" value={displayName} />
            <FormField label="Username" autoCapitalize="none" onChangeText={setUsername} placeholder="morgan_reyes" value={username} />
            <FormField label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" value={email} />
            <FormField label="Password" autoComplete="new-password" onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry value={password} />
            <FormField label="Confirm password" autoComplete="new-password" onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry value={confirmPassword} />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
            <PrimaryButton label="Create account" loading={loading} onPress={submit} />
          </View>
          <Text onPress={() => router.replace("/sign-in" as never)} style={styles.link}>Already have an account? Sign in</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ grow: { flex: 1 }, content: { gap: 24, paddingBottom: 38, paddingTop: 18 }, title: { color: "#171B25", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }, subtitle: { color: "#687086", fontSize: 15, lineHeight: 22, marginTop: 8 }, form: { gap: 15 }, error: { backgroundColor: "#FDF0F0", borderRadius: 12, color: "#B52D2D", fontSize: 14, lineHeight: 20, padding: 12 }, notice: { backgroundColor: "#EDF8F4", borderRadius: 12, color: "#16704F", fontSize: 14, lineHeight: 20, padding: 12 }, link: { color: "#3858E9", fontSize: 15, fontWeight: "800", paddingBottom: 10, textAlign: "center" } });
