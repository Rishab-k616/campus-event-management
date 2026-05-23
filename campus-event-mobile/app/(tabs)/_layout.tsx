import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { SplashScreen } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopColor: colors.line
        },
        tabBarLabelStyle: { fontWeight: "800" }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={22} /> }} />
      <Tabs.Screen name="live" options={{ title: "Live", tabBarIcon: ({ color }) => <Ionicons name="radio" color={color} size={22} /> }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts", tabBarIcon: ({ color }) => <Ionicons name="notifications" color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person" color={color} size={22} /> }} />
    </Tabs>
  );
}
