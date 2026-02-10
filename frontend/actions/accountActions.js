"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function getAccountsAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/accounts", {
      headers: { Cookie: `session_token=${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error in getAccountsAction:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.error || "Failed to fetch accounts");
  }
}

export async function getAccountDetailsAction(accountId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get(`/accounts/${accountId}/details`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error in getAccountDetailsAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to fetch account details",
    );
  }
}

export async function getAccountHistoryAction(accountId, startDate, endDate) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(
      `/account-history/${accountId}${queryString}`,
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error in getAccountHistoryAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to fetch account history",
    );
  }
}

export async function fetchAccountTypes() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/account-types", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching account types:", error);
    return { success: false, error: error.message };
  }
}

export async function createAccountAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/accounts", data, {
      headers: {
        Cookie: `session_token=${token}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating account:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAccountAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(`/accounts/${id}`, data, {
      headers: {
        Cookie: `session_token=${token}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating account:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccountAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    await api.delete(`/accounts/${id}`, {
      headers: {
        Cookie: `session_token=${token}`,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBalanceManuallyAction(accountId, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post(`/accounts/${accountId}/balance`, data, {
      headers: { Cookie: `session_token=${token}` },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error in updateBalanceManuallyAction:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.error || "Failed to update balance");
  }
}

export async function recalculateBalanceAction(accountId, dryRun = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post(
      `/accounts/${accountId}/recalculate?dryRun=${dryRun}`,
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error in recalculateBalanceAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to recalculate balance",
    );
  }
}

export async function createAccountTypeAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post("/account-types", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating account type:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAccountTypeAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.put(`/account-types/${id}`, data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating account type:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccountTypeAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    await api.delete(`/account-types/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting account type:", error);
    return { success: false, error: error.message };
  }
}
