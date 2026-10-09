// CivicTwin Autonomous Notification Store
export interface AppNotification {
  id: string;
  targetRole: "all" | "citizen" | "department" | "commissioner";
  targetUserId?: number;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
  timestamp: string;
  read: boolean;
  clusterId?: number;
}

const STORAGE_KEY = "civictwin_notifications";
const EVENT_NAME = "civictwin_notification_change";

// Initial seed notifications if none exist
const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-seed-1",
    targetRole: "all",
    title: "🏛️ CivicTwin Autonomous Dispatch Active",
    message: "AI agent pipeline is actively monitoring municipal defect telemetry across 4 city departments.",
    type: "info",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: "notif-seed-2",
    targetRole: "citizen",
    title: "📋 Grievance Registered #1",
    message: "Your complaint regarding 'Deep Waterlogged Crater near Anna Nagar Higher Secondary School' was received.",
    type: "info",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    clusterId: 1,
  },
  {
    id: "notif-seed-3",
    targetRole: "department",
    title: "⚡ Priority Escalation Alert",
    message: "Cluster #1 escalated to Tier 1 Critical Priority (Score: 0.94) due to 14 duplicate citizen reports near school.",
    type: "warning",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    read: false,
    clusterId: 1,
  },
];

export function getStoredNotifications(): AppNotification[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read notifications", err);
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(list: AppNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.error("Failed to save notifications", err);
  }
}

export function addNotification(
  notif: Omit<AppNotification, "id" | "timestamp" | "read">
): AppNotification {
  const current = getStoredNotifications();
  const created: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  const updated = [created, ...current];
  saveStoredNotifications(updated);
  return created;
}

export function markAsRead(id: string) {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}

export function markAllAsRead(role?: string) {
  const current = getStoredNotifications();
  const updated = current.map((n) => {
    if (!role || n.targetRole === "all" || n.targetRole === role) {
      return { ...n, read: true };
    }
    return n;
  });
  saveStoredNotifications(updated);
}

export function clearNotifications(role?: string) {
  if (!role) {
    saveStoredNotifications([]);
    return;
  }
  const current = getStoredNotifications();
  const filtered = current.filter((n) => n.targetRole !== role && n.targetRole !== "all");
  saveStoredNotifications(filtered);
}

export function subscribeToNotifications(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}
