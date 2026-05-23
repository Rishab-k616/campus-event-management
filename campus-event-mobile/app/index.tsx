import { Redirect } from "expo-router";
import React from "react";
import { SplashScreen } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return <Redirect href={user ? "/(tabs)/home" : "/auth/login"} />;
}
