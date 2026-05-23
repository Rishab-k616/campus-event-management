import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Header, NotificationCard, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { api, NotificationItem } from "@/utils/api";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unread = notifications.filter((item) => !item.is_read).length;

  const load = useCallback(async () => {
    setNotifications(await api.getNotifications());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    await load();
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    await load();
  };

  return (
    <Screen>
      <Header title="Notification center" subtitle="Approvals, event updates, notices, and unread items." variant="student" />
      <View style={styles.summary}>
        <Text style={styles.summaryValue}>{unread}</Text>
        <Text style={styles.summaryLabel}>unread notifications</Text>
        <PrimaryButton title="Mark all as read" tone="muted" onPress={markAll} icon="checkmark-done-outline" />
      </View>
      {notifications.map((item) => <NotificationCard key={item.id} item={item} onRead={() => markRead(item.id)} />)}
      {!notifications.length ? <Text style={styles.empty}>No notifications yet.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  summaryValue: { color: colors.text, fontSize: 34, fontWeight: "900" },
  summaryLabel: { color: colors.muted, fontWeight: "800" },
  empty: { color: colors.muted, textAlign: "center", fontWeight: "700", marginTop: spacing.lg }
});
