"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchTransactions(
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

    const pageNum = typeof page === "number" ? page : 1;
    let query = `page=${pageNum}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&`;
    if (startDate) query += `startDate=${startDate}&`;
    if (endDate) query += `endDate=${endDate}&`;
    if (search) query += `search=${search}&`;
    if (type) query += `type=${type}&`;
    if (status) query += `status=${status}&`;

    const response = await api.get(`/transactions?${query}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchPendingBills() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/transactions/pending-bills", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching pending bills:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchUnsettledCount() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/transactions/unsettled-count", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching unsettled count:", error);
    return { success: false, error: error.message };
  }
}

export async function getTransactionsByAccountAction(accountId, limit = 100) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get(
      `/transactions?accountId=${accountId}&limit=${limit}`,
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data.transactions || response.data };
  } catch (error) {
    console.error("Error fetching account transactions:", error);
    return { success: false, error: error.message };
  }
}

export async function createTransactionAction(formData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/transactions", formData, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function bulkCreateTransactionsAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/transactions/bulk", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating bulk transactions:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

export async function updateTransactionAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(`/transactions/${id}`, data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function settleTransactionAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(
      `/transactions/${id}`,
      {
        ...data,
        status: "settled",
      },
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error settling transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTransactionAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    await api.delete(`/transactions/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadBillAction(formData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/transactions/upload-bill", formData, {
      headers: {
        Cookie: `session_token=${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error uploading bill:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

export async function snoozeBillAction(billId, hours = 24) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(
      `/transactions/${billId}/snooze`,
      { hours },
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error snoozing bill:", error);
    return { success: false, error: error.message };
  }
}

export async function markBillPaidAction(billId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(
      `/transactions/${billId}`,
      { status: "settled" },
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error marking bill as paid:", error);
    return { success: false, error: error.message };
  }
}
