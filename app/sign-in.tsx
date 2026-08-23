import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { FormField, PrimaryButton, ScreenHeader } from "@/components/chat-ui";
import { ScreenContainer } from "@/components/screen-container";
import { signIn } from "@/lib/chat-api";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) return setError(result.error.message);
    router.replace("/(tabs)" as never);
  };

  return (
    <ScreenContainer className="px-6" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.grow}>
        <ScreenHeader title="Welcome back" onBack={() => router.back()} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View><Text style={styles.title}>Sign in to Chat</Text><Text style={styles.subtitle}>Use the email and password registered to your account.</Text></View>
          <View style={styles.form}>
            <FormField label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="name@example.com" value={email} />
            <FormField label="Password" autoComplete="password" onChangeText={setPassword} placeholder="Your password" secureTextEntry value={password} />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Sign in" loading={loading} onPress={submit} />
          </View>
          <Text onPress={() => router.push("/forgot-password" as never)} style={styles.link}>Forgot password?</Text>
          <Text onPress={() => router.replace("/sign-up" as never)} style={styles.link}>New here? Create an account</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ grow: { flex: 1 }, content: { flexGrow: 1, gap: 28, justifyContent: "center", paddingBottom: 40, paddingTop: 20 }, title: { color: "#171B25", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }, subtitle: { color: "#687086", fontSize: 15, lineHeight: 22, marginTop: 8 }, form: { gap: 16 }, error: { backgroundColor: "#FDF0F0", borderRadius: 12, color: "#B52D2D", fontSize: 14, lineHeight: 20, padding: 12 }, link: { color: "#3858E9", fontSize: 15, fontWeight: "800", textAlign: "center" } });
