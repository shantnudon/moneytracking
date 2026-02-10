"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchBudgets() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/budgets", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return { success: false, error: error.message };
  }
}

export async function createBudgetAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/budgets", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating budget:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBudgetAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(`/budgets/${id}`, data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBudgetAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    await api.delete(`/budgets/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return { success: false, error: error.message };
  }
}
