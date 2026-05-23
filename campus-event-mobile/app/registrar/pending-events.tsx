import React, { useCallback, useState } from "react";
import { Alert, Text } from "react-native";
import { EventCard, Header, PrimaryButton, ReasonModal, Screen } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { api, EventItem } from "@/utils/api";

export default function PendingEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setEvents(await api.getPendingEvents());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    await api.approveEvent(id);
    await load();
    Alert.alert("Approved", "The event is now visible to students.");
  };

  const reject = async () => {
    if (!selected) {
      return;
    }
    await api.rejectEvent(selected.id, reason.trim() || undefined);
    setSelected(null);
    setReason("");
    await load();
  };

  return (
    <Screen>
      <Header title="Pending approvals" subtitle="Review submissions and approve or reject with reasons." variant="registrar" />
      <Text style={{ color: colors.muted, fontWeight: "800", marginBottom: spacing.md }}>{events.length} event proposals pending</Text>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          actions={
            <>
              <PrimaryButton title="Approve" tone="success" icon="checkmark-outline" onPress={() => approve(event.id)} />
              <PrimaryButton title="Reject" tone="danger" icon="close-outline" onPress={() => setSelected(event)} />
            </>
          }
        />
      ))}
      {!events.length ? <Text style={{ color: colors.muted, textAlign: "center", fontWeight: "700" }}>No pending events.</Text> : null}
      <ReasonModal visible={Boolean(selected)} reason={reason} onChangeReason={setReason} onCancel={() => setSelected(null)} onSubmit={reject} />
    </Screen>
  );
}
