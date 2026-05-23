import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Field, Header, PasswordField, PrimaryButton, Screen, SelectField } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";

const FALLBACK_DEPARTMENTS = [
  "Arts",
  "Commerce and Management",
  "Law",
  "Medicine and Allied Health Science",
  "Science",
  "Technology",
  "Arabic",
  "Assamese",
  "Bengali",
  "Bodo",
  "Communication and Journalism",
  "Disabilities Studies",
  "Economics",
  "Education",
  "English",
  "English Language Teaching",
  "Folklore Studies",
  "Foreign Languages",
  "Hindi",
  "History",
  "Library and Information Science",
  "Linguistics",
  "Modern Indian Languages and Literary Studies",
  "Persian",
  "Philosophy",
  "Political Science",
  "Psychology",
  "Sanskrit",
  "Sociology",
  "Women's Studies",
  "Business Administration",
  "Commerce",
  "Anthropology",
  "Botany",
  "Chemistry",
  "Environmental Science",
  "Geography",
  "Geological Sciences",
  "Mathematics",
  "Physics",
  "Statistics",
  "Zoology",
  "Applied Sciences",
  "Bioengineering and Technology",
  "Biotechnology",
  "Computer Science",
  "Electronics and Communication Engineering",
  "Electronics and Communication Technology",
  "Information Technology",
  "Instrumentation and USIC"
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [departments, setDepartments] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getDepartments()
      .then((items) => {
        const list = items.length ? items : FALLBACK_DEPARTMENTS;
        setDepartments(list);
        setDepartment(list[0] ?? "");
      })
      .catch(() => {
        setDepartments(FALLBACK_DEPARTMENTS);
        setDepartment(FALLBACK_DEPARTMENTS[0]);
      });
  }, []);

  const submit = async () => {
    if (!name || !email || !password || !department) {
      Alert.alert("Missing details", "Complete every required field.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Confirm password must match.");
      return;
    }
    setLoading(true);
    try {
      await register({ name, email: email.trim().toLowerCase(), password, department });
    } catch (error) {
      Alert.alert("Registration failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Create student account" subtitle="Student registration is open. Admin and registrar accounts are provisioned by the institution." variant="auth" />
      <View style={styles.card}>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="John Doe" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="john@test.com" keyboardType="email-address" />
        <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 6 characters" />
        <PasswordField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" />
        <SelectField label="Department" value={department} options={departments} onChange={setDepartment} />
        <PrimaryButton title="Register" onPress={submit} loading={loading} icon="person-add-outline" />
        <Text style={styles.footerText}>
          Already registered? <Link href="/auth/login" style={styles.link}>Login</Link>
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
