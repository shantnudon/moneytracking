"use client";

import { useState, useEffect } from "react";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  fetchAdminUsers,
  fetchRegistrationStatus,
  toggleRegistrationAction,
  toggleUserStatusAction,
  deleteUserAction,
} from "@/actions/adminActions";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchRegStatus();
  }, []);

  const fetchUsers = async () => {
    const result = await fetchAdminUsers();
    if (result.success) {
      setUsers(result.data);
    }
  };

  const fetchRegStatus = async () => {
    const result = await fetchRegistrationStatus();
    if (result.success) {
      setRegistrationEnabled(result.data.enabled);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    const result = await toggleUserStatusAction(userId);
    if (result.success) {
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      const result = await deleteUserAction(userId);
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.error || "Error deleting user");
      }
    }
  };

  const handleToggleRegistration = async () => {
    const result = await toggleRegistrationAction();
    if (result.success) {
      setRegistrationEnabled(result.data.enabled);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold  ">User Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm  ">Registration:</span>
          <button
            onClick={handleToggleRegistration}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              registrationEnabled
                ? "bg-green-600 hover:bg-green-700  "
                : "bg-red-600 hover:bg-red-700  "
            }`}
          >
            {registrationEnabled ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
            {registrationEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      <div className="  border border-gray-800 rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="  border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium  ">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium  ">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium  ">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium  ">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium  ">
                  Created
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium  ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover: ">
                  <td className="px-4 py-3 text-sm  ">{user.name || "N/A"}</td>
                  <td className="px-4 py-3 text-sm  ">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-900 text-purple-200"
                          : "bg-blue-900 text-blue-200"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive
                          ? "bg-green-900 text-green-200"
                          : "bg-red-900 text-red-200"
                      }`}
                    >
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm  ">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          user.isActive
                            ? "bg-yellow-600 hover:bg-yellow-700  "
                            : "bg-green-600 hover:bg-green-700  "
                        }`}
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
