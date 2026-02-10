"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
} from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notificationActions";
import { fetchUnsettledCount } from "@/actions/transactionActions";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unsettledCount, setUnsettledCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCounts = async () => {
    const [unreadRes, unsettledRes] = await Promise.all([
      fetchUnreadNotificationCount(),
      fetchUnsettledCount(),
    ]);

    if (unreadRes.success) {
      setUnreadCount(unreadRes.data.count);
    }
    if (unsettledRes.success) {
      setUnsettledCount(unsettledRes.data.count);
    }
  };

  const loadNotifications = async () => {
    const res = await fetchNotifications();
    if (res.success) {
      setNotifications(res.data);
    }
  };

  const handleMarkRead = async (id) => {
    const res = await markNotificationReadAction(id);
    if (res.success) {
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsReadAction();
    if (res.success) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="text-green-500" size={16} />;
      case "WARNING":
        return <AlertTriangle className="text-yellow-500" size={16} />;
      case "ERROR":
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 border border-foreground hover:border-2 hover:text-background transition-all group"
      >
        <Bell size={20} className="text-foreground" />
        {(unreadCount > 0 || unsettledCount > 0) && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-xs font-black flex items-center justify-center border border-background">
            {unreadCount + unsettledCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-foreground shadow-[8px_8px_0px_0px_rgba(var(--foreground-rgb),0.2)] z-50">
          <div className="p-4 border-b border-foreground flex justify-between items-center bg-muted/10 text-foreground">
            <h3 className="text-xs font-black uppercase tracking-widest">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-black uppercase tracking-tighter border-b border-foreground hover:italic"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {unsettledCount > 0 && (
              <div className="p-4 border-b border-foreground bg-muted/20 group cursor-pointer hover:bg-foreground hover:text-background transition-all">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <AlertTriangle
                      size={16}
                      className="group-hover:text-background"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">
                      Attention Required
                    </p>
                    <p className="text-xs font-bold mt-1 tracking-tighter">
                      You have {unsettledCount} unsettled transactions waiting
                      for review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {notifications.length === 0 && unsettledCount === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-foreground/69 italic">
                  All clear
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-foreground last:border-b-0 transition-all ${
                    n.isRead ? "opacity-60" : "bg-background"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black uppercase tracking-tight">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 hover:bg-muted100 rounded"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-medium mt-1 tracking-tighter leading-tight">
                        {n.message}
                      </p>
                      <p className="text-xs font-bold text-foreground/69 mt-2 uppercase">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
