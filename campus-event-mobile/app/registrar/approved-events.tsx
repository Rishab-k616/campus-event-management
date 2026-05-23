import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { EventCard, Header, Screen } from "@/components/ui";
import { colors } from "@/constants/theme";
import { api, EventItem } from "@/utils/api";

export default function ApprovedEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);

  const load = useCallback(async () => {
    const data = await api.getEvents();
    setEvents(data.filter((event) => event.status === "approved" || event.status === "live"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Header title="Approved events" subtitle="A clean list of registrar-approved public events." variant="registrar" />
      {events.map((event) => <EventCard key={event.id} event={event} />)}
      {!events.length ? <Text style={{ color: colors.muted, textAlign: "center", fontWeight: "700" }}>No approved events yet.</Text> : null}
    </Screen>
  );
}
