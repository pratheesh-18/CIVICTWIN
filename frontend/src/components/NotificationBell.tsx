"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import {
  AppNotification,
  getStoredNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  subscribeToNotifications,
} from "../lib/notifications";

interface NotificationBellProps {
  userRole?: "citizen" | "department" | "commissioner";
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userRole = "all" }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = () => {
    const all = getStoredNotifications();
    const relevant = all.filter(
      (n) => n.targetRole === "all" || n.targetRole === userRole || userRole === "commissioner"
    );
    setNotifications(relevant);
  };

  useEffect(() => {
    loadNotifs();
    const unsubscribe = subscribeToNotifications(loadNotifs);
    return () => unsubscribe();
  }, [userRole]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAll = () => {
    markAllAsRead(userRole);
    loadNotifs();
  };

  const handleClear = () => {
    clearNotifications(userRole);
    loadNotifs();
  };

  const handleItemClick = (id: string) => {
    markAsRead(id);
    loadNotifs();
  };

  const formatTime = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return new Date(iso).toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 transition-colors shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60 rounded-md transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-400 text-xs font-semibold space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-300" />
                <p>No notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => {
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n.id)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                      !n.read ? "bg-emerald-50/40" : "bg-white"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {n.type === "success" ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : n.type === "warning" ? (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            !n.read ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 self-center"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              CivicTwin Real-Time Resolution Telemetry
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
