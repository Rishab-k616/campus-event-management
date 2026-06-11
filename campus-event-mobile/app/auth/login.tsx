import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Field, Header, PasswordField, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async () => {
    setErrorMessage("");
    if (!email || !password) {
      const message = "Enter your email and password.";
      setErrorMessage(message);
      Alert.alert("Missing details", message);
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try again.";
      setErrorMessage(message);
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Welcome back" subtitle="Sign in to manage campus events, approvals, and notifications." variant="auth" />
      <View style={styles.card}>
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="john@test.com" keyboardType="email-address" />
        <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="Your password" />
        {loading ? <Text style={styles.statusText}>Connecting to the campus server...</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <PrimaryButton title="Login" onPress={submit} loading={loading} icon="log-in-outline" />
        <Text style={styles.footerText}>
          Student account? <Link href="/auth/register" style={styles.link}>Register here</Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  footerText: { marginTop: spacing.md, textAlign: "center", color: colors.muted, fontWeight: "700" },
  link: { color: colors.primary, fontWeight: "900" },
  statusText: { color: colors.primary, fontWeight: "800", marginBottom: spacing.sm, textAlign: "center" },
  errorText: { color: colors.red, fontWeight: "800", marginBottom: spacing.sm, textAlign: "center", lineHeight: 20 }
});
