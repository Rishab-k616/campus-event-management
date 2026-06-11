import { getAuthToken } from "@/utils/authStorage";

export type Role = "student" | "admin" | "registrar";
export type EventStatus = "pending" | "approved" | "rejected" | "live" | "completed";

export type User = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: Role;
  mail_notifications_enabled: boolean;
  created_at: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  department: string;
  status: EventStatus;
  created_by: string;
  created_by_name?: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type NotificationItem = {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ?? "";
const REQUEST_TIMEOUT_MS = 75_000;

function getApiUrl(): string {
  if (!API_URL) {
    throw new Error(
      "EXPO_PUBLIC_BACKEND_URL is not set. Set EXPO_PUBLIC_BACKEND_URL in campus-event-mobile/.env and restart Expo."
    );
  }

  if (API_URL.includes("YOUR_LOCAL_IP")) {
    throw new Error(
      "EXPO_PUBLIC_BACKEND_URL is still using the placeholder value. Replace YOUR_LOCAL_IP with your backend IP."
    );
  }

  return API_URL;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options.auth !== false) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The server took too long to respond. Render may be waking up; please try again.");
    }
    throw new Error(
      `Cannot reach backend at ${getApiUrl()}. Make sure FastAPI is running and EXPO_PUBLIC_BACKEND_URL is correct.`
    );
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`The server returned an invalid response (${response.status}). Please try again.`);
    }
  }

  if (!response.ok) {
    const detail = data?.detail || "Request failed";
    throw new Error(Array.isArray(detail) ? detail[0]?.msg || "Validation failed" : detail);
  }

  return data as T;
}

export const api = {
  register: (payload: { name: string; email: string; password: string; department: string }) =>
    request<User>("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string }>("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request<User>("/auth/me"),
  updateNotificationPreferences: (payload: { mail_notifications_enabled: boolean }) =>
    request<User>("/auth/notification-preferences", { method: "PUT", body: payload }),
  getEvents: () => request<EventItem[]>("/events"),
  getLiveEvents: () => request<EventItem[]>("/events/live"),
  getPendingEvents: () => request<EventItem[]>("/events/pending"),
  getMyEvents: () => request<EventItem[]>("/events/my-events"),
  createEvent: (payload: Omit<EventItem, "id" | "created_by" | "status" | "created_at">) =>
    request<EventItem>("/events", { method: "POST", body: payload }),
  updateEvent: (id: string, payload: Partial<EventItem>) =>
    request<EventItem>(`/events/${id}`, { method: "PUT", body: payload }),
  deleteEvent: (id: string, reason?: string) =>
    request<{ message: string }>(`/events/${id}`, { method: "DELETE", body: reason ? { reason } : undefined }),
  approveEvent: (id: string) => request<EventItem>(`/events/${id}/approve`, { method: "PUT" }),
  rejectEvent: (id: string, reason?: string) =>
    request<EventItem>(`/events/${id}/reject`, { method: "PUT", body: { reason } }),
  getNotifications: () => request<NotificationItem[]>("/notifications"),
  getUnreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request<{ updated: number }>("/notifications/read-all", { method: "PUT" }),
  getDepartments: () => request<string[]>("/departments", { auth: false })
};
