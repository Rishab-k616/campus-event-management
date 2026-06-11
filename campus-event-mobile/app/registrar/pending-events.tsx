import React, { useCallback, useState } from "react";
import { Alert, Platform, Text } from "react-native";
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
    const interval = setInterval(() => {
      load();
    }, 2000);
    return () => clearInterval(interval);
  }, [load]);

  const approve = (id: string) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to approve this event? It will be broadcasted to students immediately.");
      if (confirmed) {
        (async () => {
          try {
            await api.approveEvent(id);
            await load();
            alert("The event has been approved and is now visible to students.");
          } catch (err) {
            alert(err instanceof Error ? err.message : "Could not approve event.");
          }
        })();
      }
    } else {
      Alert.alert(
        "Confirm Approval",
        "Are you sure you want to approve this event? It will be broadcasted to students immediately.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: async () => {
              try {
                await api.approveEvent(id);
                await load();
                Alert.alert("Approved", "The event has been approved and is now visible to students.");
              } catch (err) {
                Alert.alert("Error", err instanceof Error ? err.message : "Could not approve event.");
              }
            }
          }
        ]
      );
    }
  };

  const reject = () => {
    if (!selected) {
      return;
    }
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to reject this event?");
      if (confirmed) {
        (async () => {
          try {
            await api.rejectEvent(selected.id, reason.trim() || undefined);
            setSelected(null);
            setReason("");
            await load();
            alert("The event has been rejected.");
          } catch (err) {
            alert(err instanceof Error ? err.message : "Could not reject event.");
          }
        })();
      }
    } else {
      Alert.alert(
        "Confirm Rejection",
        "Are you sure you want to reject this event?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reject",
            style: "destructive",
            onPress: async () => {
              try {
                await api.rejectEvent(selected.id, reason.trim() || undefined);
                setSelected(null);
                setReason("");
                await load();
                Alert.alert("Rejected", "The event has been rejected.");
              } catch (err) {
                Alert.alert("Error", err instanceof Error ? err.message : "Could not reject event.");
              }
            }
          }
        ]
      );
    }
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
