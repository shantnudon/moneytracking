const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

export async function signup(email, password, name) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
}

/**
 * Log in an existing user
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

/**
 * Log out the current user
 */
export async function logout() {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
}

/**
 * Get current user information
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
  }

  return data.user;
}

/**
 * Verify current session
 */
export async function verifySession() {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-session`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    return null;
  }

  return data.user;
}

/**
 * Refresh current session
 */
export async function refreshSession() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh-session`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to refresh session");
  }

  return data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgotpassword`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier: email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Password reset request failed");
  }

  return data;
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/reset-password/${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ password: newPassword }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Password reset failed");
  }

  return data;
}

/**
 * Check if reset token is valid
 */
export async function checkResetToken(token) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/check-reset-token/${token}`,
    {
      method: "GET",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Invalid token");
  }

  return data;
}

/**
 * Get all active sessions for current user
 */
export async function getUserSessions() {
  const response = await fetch(`${API_BASE_URL}/api/auth/sessions`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch sessions");
  }

  return data.sessions;
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/sessions/${sessionId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to revoke session");
  }

  return data;
}

/**
 * Revoke all other sessions (keep current)
 */
export async function revokeAllOtherSessions() {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/sessions/revoke-all-others`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to revoke sessions");
  }

  return data;
}
