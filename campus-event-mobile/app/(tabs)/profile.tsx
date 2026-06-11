import React from "react";
import { Alert, Platform, StyleSheet, Switch, Text, View } from "react-native";
import { Header, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { StudentProfileScreen } from "@/app/student/profile";

export default function ProfileTab() {
  const { user, logout, updateMailNotifications } = useAuth();

  if (user?.role === "student") {
    return <StudentProfileScreen />;
  }

  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const toggleMail = async (enabled: boolean) => {
    try {
      await updateMailNotifications(enabled);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Try again.";
      if (Platform.OS === "web") {
        alert("Could not update: " + msg);
      } else {
        Alert.alert("Could not update", msg);
      }
    }
  };

  return (
    <Screen>
      <Header title={`${user?.role === "admin" ? "Event Admin" : "GU Admin(Registrar)"} profile`} subtitle="Institutional account and access summary." variant={user?.role === "admin" ? "admin" : "registrar"} />
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.badge}>{user?.role === "admin" ? "EVENT ADMIN" : "GU ADMIN(REGISTRAR)"}</Text>
        <Text style={styles.meta}>Department: {user?.department}</Text>
        <View style={styles.preferenceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceLabel}>Email notifications</Text>
            <Text style={styles.preferenceText}>Receive approval, rejection, and event updates by email.</Text>
          </View>
          <Switch
            value={Boolean(user?.mail_notifications_enabled)}
            onValueChange={toggleMail}
            trackColor={{ false: "#CBD5E1", true: "#BFDBFE" }}
            thumbColor={user?.mail_notifications_enabled ? colors.primary : colors.white}
          />
        </View>
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
  badge: { overflow: "hidden", backgroundColor: colors.primary, color: colors.white, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontWeight: "900" },
  preferenceCard: { width: "100%", backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  preferenceLabel: { color: colors.muted, fontWeight: "800", marginBottom: 4 },
  preferenceText: { color: colors.text, fontWeight: "700", lineHeight: 20 }
});
