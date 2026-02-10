"use server";

import { cookies } from "next/headers";
import api from "@/utils/api";

export async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return { success: false };

    const response = await api.get("/auth/me", {
      headers: {
        Cookie: `session_token=${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Auth check failed:",
      error.response?.status || error.message,
    );
    return { success: false, error: error.message };
  }
}

export async function postLoginAction(formData) {
  try {
    const response = await api.post(`/auth/login`, formData);
    const result = response.data;
    if (result.success) {
      const cookieHeader = response.headers.get("set-cookie");
      if (cookieHeader) {
        const token = cookieHeader[0].split("=")[1].split(";")[0];
        (await cookies()).set("session_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
      }

      return {
        success: true,
        user: result.user,
      };
    }
    return {
      success: false,
      error: result.message || "Login failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Login failed",
    };
  }
}

export async function postSignupAction(formData) {
  try {
    const response = await api.post(`/auth/signup`, formData);
    const result = response.data;

    if (result.success) {
      const cookieHeader = response.headers.get("set-cookie");
      if (cookieHeader) {
        const token = cookieHeader[0].split("=")[1].split(";")[0];
        (await cookies()).set("session_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
      }
      return {
        success: true,
        user: result.user,
      };
    }

    return {
      success: false,
      error: result.message || "Registration failed",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        (error.response?.data?.errors &&
          error.response.data.errors[0]?.message) ||
        error.message ||
        "Registration failed",
    };
  }
}

export async function logoutAction() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Backend logout failed:", error);
  }
  (await cookies()).delete("session_token");
  return { success: true };
}

export async function getCheckResetTokenAction(formData) {
  try {
    const response = await api.get("/auth/check-reset-token", formData);
    return response.data;
  } catch (error) {
    throw new Error("Chud gaye guru");
  }
}

export async function postForgotPasswordAction(formData) {
  try {
    const response = await api.post("/auth/signup", formData);
    return response.data;
  } catch (error) {
    throw new Error("Chud gaye guru");
  }
}

export async function postResetPasswordAction(formData) {
  try {
    const response = await api.post("/auth/reset-password", formData);
    return response.data;
  } catch (error) {
    throw new Error("Chud gaye guru");
  }
}
