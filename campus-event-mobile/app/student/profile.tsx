import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Switch, Text, View } from "react-native";
import { EventCalendar } from "@/components/EventCalendar";
import { Header, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { api, EventItem } from "@/utils/api";

export function StudentProfileScreen() {
  const { user, logout, updateMailNotifications } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    let mounted = true;
    api.getEvents()
      .then((items) => {
        if (mounted) {
          setEvents(items);
        }
      })
      .catch(() => {
        if (mounted) {
          setEvents([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

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
        <View style={styles.preferenceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Email notifications</Text>
            <Text style={styles.preferenceText}>Receive important campus event updates by email.</Text>
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
      <EventCalendar events={events} />
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
  infoValue: { color: colors.text, fontWeight: "900", fontSize: 16 },
  preferenceCard: { width: "100%", backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  preferenceText: { color: colors.text, fontWeight: "700", lineHeight: 20 }
});
