import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EventCalendar } from "@/components/EventCalendar";
import { EventCard, Header, PrimaryButton, Screen, StatCard } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { api, EventItem } from "@/utils/api";

export default function HomeScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");

  const load = useCallback(async () => {
    const data = user?.role === "admin" || user?.role === "registrar" ? await api.getMyEvents() : await api.getEvents();
    setEvents(data);
  }, [user?.role]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (user?.role === "admin") {
    const pending = events.filter((event) => event.status === "pending").length;
    const approved = events.filter((event) => event.status === "approved" || event.status === "live").length;
    return (
      <Screen>
        <Header title="Admin dashboard" subtitle="Create, edit, and monitor events submitted by your office." variant="admin" />
        <View style={styles.statsRow}>
          <StatCard label="My events" value={String(events.length)} icon="albums-outline" />
          <StatCard label="Pending" value={String(pending)} icon="hourglass-outline" />
          <StatCard label="Approved" value={String(approved)} icon="checkmark-circle-outline" />
        </View>
        <View style={styles.quickCard}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <PrimaryButton title="Create event" icon="add-circle-outline" onPress={() => router.push("/admin/create-event")} />
          <PrimaryButton title="My events" tone="muted" icon="list-outline" onPress={() => router.push("/admin/my-events")} />
        </View>
        <EventCalendar events={events} />
        {events.slice(0, 3).map((event) => <EventCard key={event.id} event={event} />)}
      </Screen>
    );
  }

  if (user?.role === "registrar") {
    return (
      <Screen>
        <Header title="Registrar dashboard" subtitle="Review event proposals and keep the approval queue moving." variant="registrar" />
        <View style={styles.statsRow}>
          <StatCard label="Pending queue" value="Review" icon="file-tray-full-outline" />
          <StatCard label="Approved events" value="Live" icon="shield-checkmark-outline" />
        </View>
        <View style={styles.quickCard}>
          <Text style={styles.sectionTitle}>Approval workflow</Text>
          <PrimaryButton title="Pending events" icon="time-outline" onPress={() => router.push("/registrar/pending-events")} />
          <PrimaryButton title="Approved events" tone="muted" icon="checkmark-done-outline" onPress={() => router.push("/registrar/approved-events")} />
        </View>
        <EventCalendar events={events} />
      </Screen>
    );
  }

  const departments = ["All", ...Array.from(new Set(events.map((event) => event.department)))];
  const filtered = events.filter((event) => {
    const matchesQuery = event.title.toLowerCase().includes(query.toLowerCase()) || event.venue.toLowerCase().includes(query.toLowerCase());
    const matchesDepartment = department === "All" || event.department === department;
    return matchesQuery && matchesDepartment;
  });

  return (
    <Screen>
      <Header title={`Hi, ${user?.name.split(" ")[0] ?? "Student"}`} subtitle="Explore approved events across your campus." variant="student" />
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search events or venues" placeholderTextColor="#94A3B8" style={styles.searchInput} />
      </View>
      <View style={styles.chipRow}>
        {departments.map((item) => (
          <Pressable key={item} style={[styles.filterChip, department === item && styles.filterChipActive]} onPress={() => setDepartment(item)}>
            <Text style={[styles.filterText, department === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <EventCalendar events={filtered} />
      {filtered.map((event) => <EventCard key={event.id} event={event} />)}
      {!filtered.length ? <Text style={styles.empty}>No approved events match your filters.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  quickCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, minHeight: 52, marginBottom: spacing.md },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: "800" },
  filterTextActive: { color: colors.white },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg, fontWeight: "700" }
});
