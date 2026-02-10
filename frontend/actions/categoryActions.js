"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchCategories() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/categories", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: error.message };
  }
}

export async function createCategoryAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/categories", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategoryAction(id, data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put(`/categories/${id}`, data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategoryAction(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    await api.delete(`/categories/${id}`, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }
}
