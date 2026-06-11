import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Header, NotificationCard, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { api, NotificationItem } from "@/utils/api";

export default function NotificationsScreen() {
  const { palette, mode } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "system">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isDark = mode === "dark";
  const unread = notifications.filter((item) => !item.is_read).length;

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      setNotifications(await api.getNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);

      const interval = setInterval(() => {
        load(false);
      }, 2000);

      return () => {
        clearInterval(interval);
      };
    }, [load])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not mark notification as read.");
    }
  };

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead();
      await load();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not mark notifications as read.");
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") {
      return !item.is_read;
    }
    if (filter === "system") {
      return item.type === "welcome" || item.type.endsWith("_public");
    }
    return true;
  });

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <Header title="Notification center" subtitle="Approvals, event updates, notices, and unread items." variant="student" />
      
      <View style={[styles.summary, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <Text style={[styles.summaryValue, { color: palette.text }]}>{unread}</Text>
        <Text style={styles.summaryLabel}>unread notifications</Text>
        <PrimaryButton title="Mark all as read" tone="muted" onPress={markAll} icon="checkmark-done-outline" />
      </View>

      <View style={styles.filterRow}>
        {(["all", "unread", "system"] as const).map((tab) => {
          const active = filter === tab;
          let label = "";
          let count = 0;
          if (tab === "all") {
            label = "All";
            count = notifications.length;
          } else if (tab === "unread") {
            label = "Unread";
            count = unread;
          } else {
            label = "System";
            count = notifications.filter((n) => n.type === "welcome" || n.type.endsWith("_public")).length;
          }

          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[
                styles.filterTab,
                { 
                  backgroundColor: active ? colors.primary : (isDark ? "#1E293B" : "#F8FAFC"), 
                  borderColor: active ? colors.primary : palette.line 
                }
              ]}
            >
              <Text style={[styles.filterTabText, { color: active ? colors.white : palette.text }]}>
                {label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.empty}>Loading notifications...</Text> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton title="Try again" tone="muted" icon="refresh-outline" onPress={() => load(true)} />
        </View>
      ) : null}
      {filteredNotifications.map((item) => <NotificationCard key={item.id} item={item} onRead={() => markRead(item.id)} />)}
      {!loading && !filteredNotifications.length && !error ? <Text style={styles.empty}>No notifications found.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  summaryValue: { fontSize: 34, fontWeight: "900" },
  summaryLabel: { color: colors.muted, fontWeight: "800" },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  filterTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  filterTabText: { fontSize: 13, fontWeight: "800" },
  errorBox: { backgroundColor: "#FEF2F2", borderColor: "#FECACA", borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  errorText: { color: colors.red, fontWeight: "800", lineHeight: 20 },
  empty: { color: colors.muted, textAlign: "center", fontWeight: "700", marginTop: spacing.lg }
});
