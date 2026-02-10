"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchSubscriptions() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/subscriptions", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return { success: false, error: error.message };
  }
}

export async function createSubscriptionAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/subscriptions", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating subscription:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSubscriptionAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(`/subscriptions/${id}`, data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubscriptionAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    await api.delete(`/subscriptions/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return { success: false, error: error.message };
  }
}
