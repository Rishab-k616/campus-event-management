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

  const submit = async () => {
    if (!email || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Try again.");
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
  link: { color: colors.primary, fontWeight: "900" }
});
