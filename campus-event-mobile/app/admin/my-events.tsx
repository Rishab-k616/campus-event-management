import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Modal, Platform, StyleSheet, Text, View } from "react-native";
import { EventCalendar } from "@/components/EventCalendar";
import { EventCard, Field, Header, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { api, EventItem } from "@/utils/api";

type EventFilter = "all" | "pending" | "approved";

export default function MyEventsScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const activeFilter: EventFilter =
    params.filter === "pending" || params.filter === "approved" ? params.filter : "all";

  const load = useCallback(async () => {
    setEvents(await api.getMyEvents());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const deleteEvent = async (event: EventItem, reason?: string) => {
    try {
      setDeleting(true);
      await api.deleteEvent(event.id, reason);
      await load();
    } catch (error) {
      Alert.alert("Delete failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const remove = async (event: EventItem) => {
    if (event.status === "approved" || event.status === "live") {
      setDeleteTarget(event);
      setDeleteReason("");
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = typeof window !== "undefined" ? window.confirm("Delete this event? This cannot be undone.") : true;
      if (confirmed) {
        await deleteEvent(event);
      }
      return;
    }

    Alert.alert("Delete event", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteEvent(event)
      }
    ]);
  };

  const confirmApprovedDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const reason = deleteReason.trim();
    if (!reason) {
      Alert.alert("Remarks required", "Please explain why this approved event is being deleted.");
      return;
    }
    await deleteEvent(deleteTarget, reason);
    setDeleteTarget(null);
    setDeleteReason("");
  };

  const filteredEvents = events.filter((event) => {
    if (activeFilter === "pending") {
      return event.status === "pending";
    }
    if (activeFilter === "approved") {
      return event.status === "approved" || event.status === "live";
    }
    return true;
  });
  const headerTitle =
    activeFilter === "pending" ? "Pending events" : activeFilter === "approved" ? "Approved events" : "My events";
  const headerSubtitle =
    activeFilter === "pending"
      ? "Events submitted by your admin account that are waiting for registrar review."
      : activeFilter === "approved"
        ? "Events from your admin account that are approved or live."
        : "Manage events created by your admin account.";
  const calendarEvents = filteredEvents.filter((event) => event.status === "approved" || event.status === "live");

  return (
    <Screen>
      <Header title={headerTitle} subtitle={headerSubtitle} variant="admin" />
      <PrimaryButton title="Create event" icon="add-outline" onPress={() => router.push("/admin/create-event")} />
      <EventCalendar events={calendarEvents} />
      {filteredEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          actions={
            <>
              {event.status === "pending" || event.status === "rejected" ? (
                <PrimaryButton title={event.status === "rejected" ? "Edit & resubmit" : "Edit"} tone="muted" icon="create-outline" onPress={() => router.push({ pathname: "/admin/edit-event", params: { id: event.id } })} />
              ) : null}
              <PrimaryButton title="Delete" tone="danger" icon="trash-outline" onPress={() => remove(event)} />
            </>
          }
        />
      ))}
      {!filteredEvents.length ? <Text style={{ color: colors.muted, fontWeight: "800", marginTop: spacing.md, textAlign: "center" }}>No events in this view.</Text> : null}
      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete approved event</Text>
            <Text style={styles.modalText}>Remarks are required because this event is already visible to students.</Text>
            <Field label="Deletion remarks" value={deleteReason} onChangeText={setDeleteReason} placeholder="Explain why this approved event is being deleted" multiline />
            <View style={styles.modalActions}>
              <PrimaryButton title="Cancel" tone="muted" onPress={() => setDeleteTarget(null)} />
              <PrimaryButton title="Delete event" tone="danger" loading={deleting} icon="trash-outline" onPress={confirmApprovedDelete} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "center", padding: spacing.md },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  modalText: { color: colors.muted, fontWeight: "700", lineHeight: 20 },
  modalActions: { gap: spacing.sm }
});
