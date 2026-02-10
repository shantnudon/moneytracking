"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchAllData(
  startDate,
  endDate,
  search,
  page = 1,
  limit = 10,
  sortBy = "date",
  sortOrder = "desc",
  type = "",
  status = "",
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const config = {
      headers: {
        Cookie: `session_token=${token}`,
      },
    };

    const pageNum = typeof page === "number" ? page : 1;
    let query = `page=${pageNum}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&`;
    if (startDate) query += `startDate=${startDate}&`;
    if (endDate) query += `endDate=${endDate}&`;
    if (search) query += `search=${search}&`;
    if (type) query += `type=${type}&`;
    if (status) query += `status=${status}&`;

    const [t, a, b, c] = await Promise.all([
      api.get(`/transactions?${query}`, config),
      api.get("/accounts", config).catch((err) => {
        console.log(err);
        return { data: [] };
      }),
      api.get("/budgets", config),
      api.get("/categories", config),
    ]);
    return {
      transactions: t.data.transactions || t.data,
      pagination: t.data.pagination,
      accounts: a.data,
      budgets: b.data,
      categories: c.data,
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
}

export async function fetchEmailConfig() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/email/config", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching email config:", error);
    return { success: false, error: error.message };
  }
}

export async function saveEmailConfigAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/email/config", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error saving email config:", error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConfigAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/email/config/test", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error testing email config:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

export async function fetchSystemConfig() {
  try {
    const response = await api.get("/config");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching system config:", error);
    return { success: false, error: error.message };
  }
}

export async function sendAiChatMessage(message) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post(
      "/ai/chat",
      { message },
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("AI Chat Error:", error);
    return { success: false, error: error.message };
  }
}
