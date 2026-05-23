import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Field, Header, PrimaryButton, Screen, SelectField } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { api } from "@/utils/api";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [departments, setDepartments] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [deptItems, eventItems] = await Promise.all([api.getDepartments(), api.getMyEvents()]);
      const current = eventItems.find((event) => event.id === id);
      setDepartments(deptItems);
      if (current) {
        setTitle(current.title);
        setDescription(current.description);
        setDate(current.date.slice(0, 10));
        setVenue(current.venue);
        setDepartment(current.department);
      }
    };
    load();
  }, [id]);

  const submit = async () => {
    if (!id || !title || !description || !date || !venue || !department) {
      Alert.alert("Missing details", "Complete every event field.");
      return;
    }
    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert("Invalid date", "Type the date as YYYY-MM-DD, for example 2026-06-18.");
      return;
    }
    setLoading(true);
    try {
      await api.updateEvent(id, { title, description, date: parsedDate.toISOString(), venue, department });
      Alert.alert("Event updated", "Changes have been saved.");
      router.replace("/admin/my-events");
    } catch (error) {
      Alert.alert("Update failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Edit event" subtitle="Update event details before or after registrar review." variant="admin" />
      <View style={styles.card}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Research Symposium" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Brief event overview" multiline />
        <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <Field label="Venue" value={venue} onChangeText={setVenue} placeholder="Main Auditorium" />
        <SelectField label="Department" value={department} options={departments} onChange={setDepartment} />
        <PrimaryButton title="Save changes" loading={loading} onPress={submit} icon="save-outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line }
});
