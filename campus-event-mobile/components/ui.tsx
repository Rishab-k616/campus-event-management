import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  type ScrollViewProps,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { EventItem, NotificationItem } from "@/utils/api";

function formatEventDate(value: string) {
  const datePart = value.slice(0, 10);
  const parsed = new Date(`${datePart}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? datePart : parsed.toDateString();
}

export function Screen({
  children,
  refreshControl
}: {
  children: React.ReactNode;
  refreshControl?: ScrollViewProps["refreshControl"];
}) {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SplashScreen() {
  return (
    <LinearGradient colors={gradients.auth} style={styles.splash}>
      <Image source={require("../assets/gu_logo.png")} resizeMode="contain" style={styles.splashLogo} />
      <Text style={styles.splashTitle}>Campus Events</Text>
      <Text style={styles.splashText}>Preparing your campus dashboard</Text>
      <ActivityIndicator color={colors.white} style={{ marginTop: spacing.lg }} />
    </LinearGradient>
  );
}

export function Header({
  title,
  subtitle,
  variant = "student"
}: {
  title: string;
  subtitle: string;
  variant?: "student" | "admin" | "registrar" | "live" | "auth";
}) {
  const { mode, toggleTheme } = useTheme();
  return (
    <LinearGradient colors={gradients[variant]} style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Image source={require("../assets/gu_logo.png")} resizeMode="contain" style={styles.headerLogo} />
          <View>
            <Text style={styles.brandText}>Gauhati University</Text>
            <Text style={styles.brandSubtext}>Campus Event Manager</Text>
          </View>
        </View>
        <Pressable style={styles.themeButton} onPress={toggleTheme}>
          <Ionicons name={mode === "dark" ? "sunny" : "moon"} size={20} color={colors.white} />
        </Pressable>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  tone = "primary",
  icon
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  tone?: "primary" | "danger" | "success" | "muted";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { palette } = useTheme();
  const backgroundColor =
    tone === "danger" ? colors.red : tone === "success" ? colors.green : tone === "muted" ? palette.line : colors.primary;
  return (
    <Pressable style={[styles.button, { backgroundColor }]} onPress={onPress} disabled={loading}>
      {loading ? (
        <ActivityIndicator color={tone === "muted" ? colors.text : colors.white} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={tone === "muted" ? palette.text : colors.white} /> : null}
          <Text style={[styles.buttonText, tone === "muted" && { color: palette.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  multiline?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        multiline={multiline}
        style={[styles.input, { backgroundColor: palette.input, borderColor: palette.line, color: palette.text }, multiline && styles.textarea]}
      />
    </View>
  );
}

export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  const { palette } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View style={[styles.passwordRow, { backgroundColor: palette.input, borderColor: palette.line }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={!visible}
          style={[styles.passwordInput, { color: palette.text }]}
        />
        <Pressable onPress={() => setVisible((item) => !item)}>
          <Ionicons name={visible ? "eye-off" : "eye"} size={22} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { palette, mode } = useTheme();
  const selectedLabel = value || "Choose department";
  const isDark = mode === "dark";

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <Pressable style={[styles.selectButton, { backgroundColor: palette.input, borderColor: palette.line }]} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, { color: palette.text }, !value && styles.selectPlaceholder]}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.selectModalCard, { backgroundColor: palette.card }]}>
            <View style={styles.selectModalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>{label}</Text>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={palette.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.selectList} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option === value;
                const optionBg = active
                  ? (isDark ? "rgba(37, 99, 235, 0.15)" : "#EFF6FF")
                  : palette.input;
                const optionBorder = active
                  ? colors.primary
                  : palette.line;

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    style={[
                      styles.selectOption,
                      { backgroundColor: optionBg, borderColor: optionBorder }
                    ]}
                  >
                    <Text style={[styles.selectOptionText, { color: active ? colors.primary : palette.text }]}>{option}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
  onPress
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const { palette } = useTheme();
  const Container = onPress ? Pressable : View;
  return (
    <Container style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.line }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={palette.muted} style={styles.statChevron} /> : null}
    </Container>
  );
}

export function EventCard({
  event,
  actions
}: {
  event: EventItem;
  actions?: React.ReactNode;
}) {
  const { palette } = useTheme();
  const badgeColor =
    event.status === "approved" || event.status === "live"
      ? colors.green
      : event.status === "rejected"
        ? colors.red
        : colors.amber;
  return (
    <View style={[styles.eventCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
      <LinearGradient colors={["#DBEAFE", "#F8FAFC"]} style={styles.eventImage}>
        <Ionicons name={event.status === "live" ? "radio" : "sparkles"} size={34} color={colors.primary} />
      </LinearGradient>
      <View style={styles.eventBody}>
        <View style={styles.eventTop}>
          <Text style={[styles.eventTitle, { color: palette.text }]}>{event.title}</Text>
          <Text style={[styles.badge, { backgroundColor: badgeColor }]}>{event.status.toUpperCase()}</Text>
        </View>
        <Text style={[styles.eventDescription, { color: palette.muted }]}>{event.description}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.muted} />
          <Text style={[styles.meta, { color: palette.muted }]}>{formatEventDate(event.date)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={[styles.meta, { color: palette.muted }]}>{event.venue}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="business-outline" size={16} color={colors.muted} />
          <Text style={[styles.meta, { color: palette.muted }]}>{event.department}</Text>
        </View>
        {event.status === "rejected" ? (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Registrar remarks</Text>
            <Text style={styles.rejectionText}>{event.rejection_reason || "No remarks provided."}</Text>
          </View>
        ) : null}
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

function getNotificationConfig(type: string) {
  switch (type) {
    case "welcome":
      return { icon: "sparkles" as const, color: "#D97706", bg: "#FEF3C7" }; // Amber
    case "event_pending":
      return { icon: "time-outline" as const, color: "#EA580C", bg: "#FFEDD5" }; // Orange
    case "event_resubmitted":
      return { icon: "refresh-circle-outline" as const, color: "#4F46E5", bg: "#EEF2FF" }; // Indigo
    case "event_approved":
    case "event_approved_public":
      return { icon: "checkmark-circle-outline" as const, color: "#16A34A", bg: "#DCFCE7" }; // Green
    case "event_rejected":
      return { icon: "close-circle-outline" as const, color: "#DC2626", bg: "#FEE2E2" }; // Red
    case "approved_event_deleted":
    case "approved_event_deleted_public":
      return { icon: "trash-outline" as const, color: "#E11D48", bg: "#FFE4E6" }; // Rose
    default:
      return { icon: "notifications-outline" as const, color: "#2563EB", bg: "#DBEAFE" }; // Blue
  }
}

export function NotificationCard({
  item,
  onRead
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  const { palette, mode } = useTheme();
  const config = getNotificationConfig(item.type);
  const isDark = mode === "dark";
  const unreadBg = isDark ? "rgba(37, 99, 235, 0.15)" : "#EFF6FF";
  const unreadBorder = isDark ? "rgba(37, 99, 235, 0.3)" : "#BFDBFE";

  return (
    <Pressable 
      style={[
        styles.notification, 
        { backgroundColor: palette.card, borderColor: palette.line }, 
        !item.is_read && { backgroundColor: unreadBg, borderColor: unreadBorder }
      ]} 
      onPress={onRead}
    >
      <View 
        style={[
          styles.notificationIcon, 
          { 
            backgroundColor: item.is_read 
              ? (isDark ? "#334155" : "#F1F5F9") 
              : config.bg 
          }
        ]}
      >
        <Ionicons 
          name={config.icon} 
          size={22} 
          color={item.is_read ? (isDark ? "#94A3B8" : "#64748B") : config.color} 
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text 
          style={[
            styles.notificationMessage, 
            { 
              color: item.is_read ? palette.muted : palette.text,
              fontWeight: item.is_read ? "500" : "800" 
            }
          ]}
        >
          {item.message}
        </Text>
        <Text style={[styles.meta, { color: palette.muted }]}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

export function ReasonModal({
  visible,
  reason,
  onChangeReason,
  onCancel,
  onSubmit
}: {
  visible: boolean;
  reason: string;
  onChangeReason: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.modalTitle, { color: palette.text }]}>Reject event</Text>
          <Field
            label="Remarks (optional)"
            value={reason}
            onChangeText={onChangeReason}
            placeholder="Explain what needs to be changed, or leave blank"
            multiline
          />
          <View style={styles.actions}>
            <PrimaryButton title="Cancel" tone="muted" onPress={onCancel} />
            <PrimaryButton title="Reject event" tone="danger" onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 110 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  splashTitle: { marginTop: spacing.lg, color: colors.white, fontSize: 31, fontWeight: "900" },
  splashText: { marginTop: spacing.sm, color: "#DBEAFE", fontSize: 15 },
  header: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, minHeight: 116 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.sm },
  brandLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  brandText: { color: colors.white, fontSize: 14, fontWeight: "900" },
  brandSubtext: { color: "#DBEAFE", fontSize: 11, fontWeight: "800", marginTop: 2 },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  headerTitle: { color: colors.white, fontSize: 23, fontWeight: "900", letterSpacing: 0 },
  headerSubtitle: { color: "#E0F2FE", fontSize: 13, lineHeight: 19, marginTop: 4 },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  buttonText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  fieldWrap: { gap: spacing.xs, marginBottom: spacing.md },
  label: { color: colors.text, fontWeight: "800", fontSize: 14 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 15
  },
  textarea: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: "top" },
  passwordRow: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white
  },
  passwordInput: { flex: 1, color: colors.text, fontSize: 15 },
  selectButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: colors.white
  },
  selectText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  selectPlaceholder: { color: "#94A3B8" },
  selectModalCard: {
    maxHeight: "78%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  selectModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.bg
  },
  selectList: { maxHeight: 460 },
  selectOption: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: colors.white
  },
  selectOptionActive: { borderColor: colors.primary, backgroundColor: "#EFF6FF" },
  selectOptionText: { flex: 1, color: colors.text, fontWeight: "800" },
  selectOptionTextActive: { color: colors.primary },
  inputButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white
  },
  inputButtonText: { color: colors.text, fontWeight: "700" },
  statCard: {
    flex: 1,
    minWidth: 145,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line
  },
  statValue: { marginTop: spacing.sm, color: colors.text, fontSize: 24, fontWeight: "900" },
  statLabel: { marginTop: 2, color: colors.muted, fontSize: 13, fontWeight: "700" },
  statChevron: { position: "absolute", right: spacing.sm, top: spacing.sm },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line
  },
  eventImage: { height: 110, alignItems: "center", justifyContent: "center" },
  eventBody: { padding: spacing.md },
  eventTop: { gap: spacing.sm },
  eventTitle: { color: colors.text, fontSize: 19, fontWeight: "900", lineHeight: 24 },
  badge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    color: colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "900"
  },
  eventDescription: { color: colors.muted, lineHeight: 21, marginVertical: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 5 },
  meta: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  rejectionBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: spacing.md
  },
  rejectionLabel: { color: colors.red, fontSize: 12, fontWeight: "900", marginBottom: 4 },
  rejectionText: { color: colors.text, fontWeight: "700", lineHeight: 20 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  notification: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm
  },
  notificationUnread: { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE"
  },
  notificationMessage: { color: colors.text, fontWeight: "800", lineHeight: 21 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.42)", justifyContent: "center", padding: spacing.md },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: spacing.md },
  splashLogo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: spacing.lg
  },
  headerLogo: {
    width: 44,
    height: 44,
    resizeMode: "contain"
  }
});
