"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchAdminUsers() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/admin/users", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchRegistrationStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/admin/registration/status", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching registration status:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchCurrencies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/admin/currencies", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchInvestmentTypes() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/admin/investment-types", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching investment types:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleRegistrationAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post(
      "/admin/registration/toggle",
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error toggling registration:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserStatusAction(userId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.put(
      `/admin/users/${userId}/toggle-status`,
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: error.message };
  }
}

export async function createCurrencyAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post("/admin/currencies", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating currency:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCurrencyAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    await api.delete(`/admin/currencies/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting currency:", error);
    return { success: false, error: error.message };
  }
}

export async function createInvestmentTypeAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post("/admin/investment-types", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating investment type:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteInvestmentTypeAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    await api.delete(`/admin/investment-types/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting investment type:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUserAction(userId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    await api.delete(`/admin/users/${userId}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}
