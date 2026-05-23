import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "authToken";

function canUseSessionStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export async function getAuthToken() {
  if (canUseSessionStorage()) {
    return window.sessionStorage.getItem(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeAuthToken() {
  if (canUseSessionStorage()) {
    window.sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}
