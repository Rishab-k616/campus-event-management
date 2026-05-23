import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { EventCard, Header, Screen } from "@/components/ui";
import { colors } from "@/constants/theme";
import { api, EventItem } from "@/utils/api";

export default function StudentEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  const load = useCallback(async () => {
    setEvents(await api.getEvents());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Header title="Student events" subtitle="Approved events available to students." variant="student" />
      {events.map((event) => <EventCard key={event.id} event={event} />)}
      {!events.length ? <Text style={{ color: colors.muted, textAlign: "center", fontWeight: "700" }}>No approved events yet.</Text> : null}
    </Screen>
  );
}
