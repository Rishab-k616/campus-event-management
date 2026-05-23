import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { EventCalendar } from "@/components/EventCalendar";
import { EventCard, Header, PrimaryButton, Screen } from "@/components/ui";
import { api, EventItem } from "@/utils/api";

export default function MyEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  const load = useCallback(async () => {
    setEvents(await api.getMyEvents());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    const deleteEvent = async () => {
      try {
        await api.deleteEvent(id);
        await load();
      } catch (error) {
        Alert.alert("Delete failed", error instanceof Error ? error.message : "Try again.");
      }
    };

    if (Platform.OS === "web") {
      const confirmed = typeof window !== "undefined" ? window.confirm("Delete this event? This cannot be undone.") : true;
      if (confirmed) {
        await deleteEvent();
      }
      return;
    }

    Alert.alert("Delete event", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: deleteEvent
      }
    ]);
  };

  return (
    <Screen>
      <Header title="My events" subtitle="Manage events created by your admin account." variant="admin" />
      <PrimaryButton title="Create event" icon="add-outline" onPress={() => router.push("/admin/create-event")} />
      <EventCalendar events={events} />
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          actions={
            <>
              <PrimaryButton title="Edit" tone="muted" icon="create-outline" onPress={() => router.push({ pathname: "/admin/edit-event", params: { id: event.id } })} />
              <PrimaryButton title="Delete" tone="danger" icon="trash-outline" onPress={() => remove(event.id)} />
            </>
          }
        />
      ))}
    </Screen>
  );
}
