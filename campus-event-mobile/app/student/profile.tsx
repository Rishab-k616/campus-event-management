import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Header, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export function StudentProfileScreen() {
  const { user, logout } = useAuth();
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Screen>
      <Header title="Student profile" subtitle="Your personal campus event identity." variant="student" />
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.badge}>STUDENT</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{user?.department}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>Student attendee</Text>
        </View>
        <PrimaryButton title="Logout" tone="danger" icon="log-out-outline" onPress={logout} />
      </View>
    </Screen>
  );
}

export default StudentProfileScreen;

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 100, height: 100, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#DBEAFE" },
  avatarText: { color: colors.primary, fontSize: 34, fontWeight: "900" },
  name: { color: colors.text, fontSize: 25, fontWeight: "900", textAlign: "center" },
  meta: { color: colors.muted, fontWeight: "700" },
  badge: { overflow: "hidden", backgroundColor: colors.primary, color: colors.white, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontWeight: "900" },
  infoCard: { width: "100%", backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md },
  infoLabel: { color: colors.muted, fontWeight: "800", marginBottom: 4 },
  infoValue: { color: colors.text, fontWeight: "900", fontSize: 16 }
});
