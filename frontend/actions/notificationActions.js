"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchNotifications() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/notifications", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchUnreadNotificationCount() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/notifications/unread-count", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function markNotificationReadAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.put(
      `/notifications/${id}/read`,
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.put(
      "/notifications/read-all",
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: error.message };
  }
}
