"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function getInvestmentsByAccountAction(accountId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get(`/investments/account/${accountId}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error in getInvestmentsByAccountAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to fetch investments",
    );
  }
}

export async function searchInvestmentsAction(query) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get(`/investments/search?query=${query}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error in searchInvestmentsAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to search investments",
    );
  }
}

export async function getInvestmentQuoteAction(symbol) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get(`/investments/quote?symbol=${symbol}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error in getInvestmentQuoteAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to fetch investment quote",
    );
  }
}

export async function createInvestmentAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post("/investments", data, {
      headers: { Cookie: `session_token=${token}` },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error in createInvestmentAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to create investment",
    );
  }
}

export async function refreshInvestmentPricesAction(accountId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.post(
      `/investments/refresh/${accountId}`,
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error in refreshInvestmentPricesAction:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.error || "Failed to refresh prices");
  }
}

export async function updateInvestmentAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.put(`/investments/${id}`, data, {
      headers: { Cookie: `session_token=${token}` },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error in updateInvestmentAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to update investment",
    );
  }
}

export async function deleteInvestmentAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.delete(`/investments/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error in deleteInvestmentAction:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.error || "Failed to delete investment",
    );
  }
}
