"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function fetchUserSettings() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const response = await api.get("/user/settings", {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    // if (error.message) {
    // }
    console.error("Error fetching user settings:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserSettingsAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.put("/user/settings", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating user settings:", error);
    return { success: false, error: error.message };
  }
}

export async function completeOnboardingAction(data) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post("/onboarding", data, {
      headers: { Cookie: `session_token=${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: error.message };
  }
}

export async function completeTourAction(tourKey) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post(
      `/user/tour/${tourKey}`,
      {},
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error completing tour:", error);
    return { success: false, error: error.message };
  }
}

export async function resetToursAction(tourKey = null) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const response = await api.post(
      `/user/tours/reset`,
      { tourKey },
      {
        headers: { Cookie: `session_token=${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error resetting tours:", error);
    return { success: false, error: error.message };
  }
}
