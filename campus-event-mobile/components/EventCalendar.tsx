import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { EventItem } from "@/utils/api";
import { EventCard, PrimaryButton } from "@/components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function eventDateKey(event: EventItem) {
  return event.date.slice(0, 10);
}

function monthLabel(value: Date) {
  return value.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function EventCalendar({ events }: { events: EventItem[] }) {
  const { palette } = useTheme();
  const [cursor, setCursor] = useState(() => new Date());
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventItem[]>>((acc, event) => {
      const key = eventDateKey(event);
      acc[key] = [...(acc[key] ?? []), event];
      return acc;
    }, {});
  }, [events]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const total = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, (_, index) => ({ key: `blank-${index}`, date: null }));
    const realDays = Array.from({ length: total }, (_, index) => {
      const date = new Date(year, month, index + 1);
      return { key: dateKey(date), date };
    });
    return [...blanks, ...realDays];
  }, [cursor]);

  const selectedEvents = selectedKey ? eventsByDate[selectedKey] ?? [] : [];
  const hoveredEvents = hoveredKey ? eventsByDate[hoveredKey] ?? [] : [];

  const moveMonth = (amount: number) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.text }]}>Event calendar</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Red circles show days with scheduled events.</Text>
        </View>
      </View>
      <View style={styles.monthRow}>
        <Pressable style={[styles.navButton, { backgroundColor: palette.input }]} onPress={() => moveMonth(-1)}>
          <Ionicons name="chevron-back" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.month}>{monthLabel(cursor)}</Text>
        <Pressable style={[styles.navButton, { backgroundColor: palette.input }]} onPress={() => moveMonth(1)}>
          <Ionicons name="chevron-forward" size={20} color={palette.text} />
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={[styles.weekday, { color: palette.muted }]}>{day}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((item) => {
          if (!item.date) {
            return <View key={item.key} style={styles.dayCell} />;
          }
          const dayEvents = eventsByDate[item.key] ?? [];
          const hasEvents = dayEvents.length > 0;
          return (
            <Pressable
              key={item.key}
              style={styles.dayCell}
              onHoverIn={() => setHoveredKey(item.key)}
              onHoverOut={() => setHoveredKey(null)}
              onPress={() => {
                if (hasEvents) {
                  setSelectedKey(item.key);
                }
              }}
            >
              <View style={[styles.dayCircle, hasEvents && styles.eventCircle]}>
                <Text style={[styles.dayText, { color: palette.text }, hasEvents && styles.eventDayText]}>{item.date.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {hoveredEvents.length ? (
        <View style={styles.hoverCard}>
          <Text style={styles.hoverTitle}>{hoveredEvents.length} event{hoveredEvents.length === 1 ? "" : "s"} on this date</Text>
          {hoveredEvents.slice(0, 2).map((event) => (
            <Text key={event.id} style={styles.hoverText}>{event.title} - {event.venue}</Text>
          ))}
        </View>
      ) : null}
      <Modal visible={Boolean(selectedKey)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Scheduled events</Text>
              <Pressable style={styles.closeButton} onPress={() => setSelectedKey(null)}>
                <Ionicons name="close" size={22} color={palette.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent} showsVerticalScrollIndicator>
              {selectedEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </ScrollView>
            <PrimaryButton title="Close" tone="muted" onPress={() => setSelectedKey(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: colors.muted, fontWeight: "700", marginTop: 4 },
  navButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  month: { flex: 1, color: colors.primary, fontSize: 18, fontWeight: "900", textAlign: "center" },
  weekRow: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", color: colors.muted, fontSize: 12, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  dayCell: { width: `${100 / 7}%`, minHeight: 46, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  eventCircle: { borderWidth: 2, borderColor: colors.red, backgroundColor: "#FEF2F2" },
  dayText: { color: colors.text, fontWeight: "800" },
  eventDayText: { color: colors.red, fontWeight: "900" },
  hoverCard: { marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2", padding: spacing.md },
  hoverTitle: { color: colors.red, fontWeight: "900", marginBottom: 4 },
  hoverText: { color: colors.text, fontWeight: "700", lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.42)", justifyContent: "center", padding: spacing.md },
  modalCard: { maxHeight: "82%", backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  closeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.bg },
  modalList: { maxHeight: 480, marginBottom: spacing.md },
  modalListContent: { paddingBottom: spacing.sm }
});
