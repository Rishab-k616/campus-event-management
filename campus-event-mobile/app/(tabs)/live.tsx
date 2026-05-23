import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { EventCard, Header, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { api, EventItem } from "@/utils/api";

export default function LiveScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  const load = useCallback(async () => {
    setEvents(await api.getLiveEvents());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Header title="Live now" subtitle="Follow events currently active on campus." variant="live" />
      <View style={styles.banner}>
        <View style={styles.dot} />
        <Text style={styles.bannerText}>{events.length} live event{events.length === 1 ? "" : "s"} right now</Text>
      </View>
      {events.map((event) => <EventCard key={event.id} event={event} />)}
      {!events.length ? <Text style={styles.empty}>No live events are active right now.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: "#FECACA", marginBottom: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red },
  bannerText: { color: colors.text, fontWeight: "900" },
  empty: { color: colors.muted, textAlign: "center", fontWeight: "700", marginTop: spacing.lg }
});
