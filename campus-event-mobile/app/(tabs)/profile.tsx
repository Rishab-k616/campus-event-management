import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Header, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { StudentProfileScreen } from "@/app/student/profile";

export default function ProfileTab() {
  const { user, logout } = useAuth();

  if (user?.role === "student") {
    return <StudentProfileScreen />;
  }

  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Screen>
      <Header title={`${user?.role === "admin" ? "Admin" : "Registrar"} profile`} subtitle="Institutional account and access summary." variant={user?.role === "admin" ? "admin" : "registrar"} />
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.badge}>{user?.role.toUpperCase()}</Text>
        <Text style={styles.meta}>Department: {user?.department}</Text>
        <PrimaryButton title="Logout" tone="danger" icon="log-out-outline" onPress={logout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 92, height: 92, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: "#DBEAFE" },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: "900" },
  name: { color: colors.text, fontSize: 24, fontWeight: "900" },
  meta: { color: colors.muted, fontWeight: "700" },
  badge: { overflow: "hidden", backgroundColor: colors.primary, color: colors.white, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontWeight: "900" }
});
