"use client";

import { useState, useEffect } from "react";
import {
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "@/utils/auth";

export default function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getUserSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm("Are you sure you want to revoke this session?")) {
      return;
    }

    try {
      await revokeSession(sessionId);
      await fetchSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm("Are you sure you want to revoke all other sessions?")) {
      return;
    }

    try {
      await revokeAllOtherSessions();
      await fetchSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseUserAgent = (userAgent) => {
    if (!userAgent) return "Unknown Device";

    if (userAgent.includes("Mobile")) return "Mobile Device";
    if (userAgent.includes("Chrome")) return "Chrome Browser";
    if (userAgent.includes("Firefox")) return "Firefox Browser";
    if (userAgent.includes("Safari")) return "Safari Browser";
    return "Desktop Browser";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAllOthers}
            className="px-4 py-2 bg-red-600 text-background rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Revoke All Other Sessions
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-gray-600 mb-6">
        Manage your active sessions across different devices. You can revoke any
        session to log out from that device.
      </p>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="p-5 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg">
                      {parseUserAgent(session.userAgent).includes("Mobile")
                        ? "📱"
                        : "💻"}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {parseUserAgent(session.userAgent)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {session.ipAddress || "Unknown IP"}
                      </p>
                    </div>
                  </div>

                  <div className="ml-8 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {formatDate(session.createdAt)}
                    </p>
                    <p>
                      <span className="font-medium">Expires:</span>{" "}
                      {formatDate(session.expiresAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Security Tip</h3>
        <p className="text-sm text-blue-800">
          If you see any sessions you don't recognize, revoke them immediately
          and consider changing your password.
        </p>
      </div>
    </div>
  );
}
