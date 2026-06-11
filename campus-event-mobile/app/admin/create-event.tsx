import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Field, Header, PrimaryButton, Screen, SelectField } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { api } from "@/utils/api";

function dateInputToApiDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsedDate = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

export default function CreateEventScreen() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDepartments().then((items) => {
      setDepartments(items);
      setDepartment(items[0] ?? "");
    });
  }, []);

  const submit = async () => {
    if (!title || !description || !date || !venue || !department) {
      Alert.alert("Missing details", "Complete every event field.");
      return;
    }
    const apiDate = dateInputToApiDate(date.trim());
    if (!apiDate) {
      Alert.alert("Invalid date", "Type the date as YYYY-MM-DD, for example 2026-06-18.");
      return;
    }
    setLoading(true);
    try {
      await api.createEvent({ title, description, date: apiDate, venue, department });
      Alert.alert("Event submitted", "The event is now pending registrar approval.");
      router.replace("/admin/my-events");
    } catch (error) {
      Alert.alert("Create failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Create event" subtitle="Submit a polished event proposal for registrar approval." variant="admin" />
      <View style={styles.card}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Research Symposium" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Brief event overview" multiline />
        <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <Field label="Venue" value={venue} onChangeText={setVenue} placeholder="Main Auditorium" />
        <SelectField label="Department" value={department} options={departments} onChange={setDepartment} />
        <PrimaryButton title="Submit for approval" loading={loading} onPress={submit} icon="send-outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line }
});
