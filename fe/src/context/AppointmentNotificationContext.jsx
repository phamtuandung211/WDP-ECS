import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { useAuth } from "./AuthContext";
import { useAppointmentRealtime } from "../hooks/useAppointmentRealtime";
import { ROLE_NAME } from "../constants/role";

const AppointmentNotificationContext = createContext();

const STORAGE_PREFIX = "appointment_notifications_";

function getStorageKey(user) {
  const uid = user?.accountId || user?._id || user?.email || "anon";
  return `${STORAGE_PREFIX}${uid}`;
}

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function formatAppointmentInfo(payload) {
  if (!payload) return null;
  const parts = [];
  const date = payload.desiredDate || payload.slot?.startTime;
  if (date) {
    const d = new Date(date);
    parts.push(d.toLocaleDateString("vi-VN"));
  }
  if (payload.slot?.startTime && payload.slot?.endTime) {
    const start = new Date(payload.slot.startTime);
    const end = new Date(payload.slot.endTime);
    const fmt = (x) => `${x.getHours().toString().padStart(2, "0")}:${x.getMinutes().toString().padStart(2, "0")}`;
    parts.push(`${fmt(start)} - ${fmt(end)}`);
  }
  if (payload.type) {
    parts.push(payload.type === "BASIC" ? "Cơ bản" : "Nâng cao");
  }
  return parts.length ? parts.join(" · ") : null;
}

function notificationReducer(state, action) {
  switch (action.type) {
    case "INIT":
      return { items: action.payload.items || [] };
    case "ADD":
      return {
        items: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: action.payload.type,
            message: action.payload.message,
            appointmentInfo: action.payload.appointmentInfo || null,
            read: false,
            createdAt: Date.now(),
          },
          ...state.items,
        ],
      };
    case "MARK_ALL_READ":
      return {
        items: state.items.map((n) => ({ ...n, read: true })),
      };
    case "MARK_AS_READ":
      return {
        items: state.items.map((n) =>
          n.id === action.payload.id ? { ...n, read: true } : n,
        ),
      };
    case "CLEAR_ALL":
      return { items: [] };
    default:
      return state;
  }
}

function AppointmentNotificationInner({ children, user }) {
  const storageKey = getStorageKey(user);
  const [state, dispatch] = useReducer(notificationReducer, {
    items: loadFromStorage(storageKey),
  });
  const [toast, setToast] = React.useState(null);

  // Load from localStorage when user changes (storageKey changes)
  useEffect(() => {
    dispatch({ type: "INIT", payload: { items: loadFromStorage(storageKey) } });
  }, [storageKey]);

  // Save to localStorage whenever items change
  useEffect(() => {
    saveToStorage(storageKey, state.items);
  }, [storageKey, state.items]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const addNotification = useCallback((type, message, appointmentInfo) => {
    dispatch({
      type: "ADD",
      payload: { type, message, appointmentInfo: appointmentInfo || null },
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: "MARK_ALL_READ" });
  }, []);

  const markAsRead = useCallback((id) => {
    dispatch({ type: "MARK_AS_READ", payload: { id } });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const isDoctor = user?.role === ROLE_NAME.DOCTOR;

  useAppointmentRealtime({
    onWaitingAssign: (payload) => {
      if (payload?.replay) return;
      const msg = "Có lịch hẹn mới cần phân công bác sĩ";
      const info = formatAppointmentInfo(payload);
      addNotification("waiting_assign", msg, info);
      setToast({ type: "waiting_assign", message: msg, appointmentInfo: info });
      window.dispatchEvent(
        new CustomEvent("appointment-notification", {
          detail: { type: "appointment_waiting_assign", payload },
        }),
      );
    },
    onAssigned: (payload) => {
      if (payload?.replay) return;
      const msg = isDoctor
        ? "Bạn được phân công lịch hẹn"
        : "Lịch hẹn của bạn đã được phân bác sĩ. Vui lòng kiểm tra.";
      const info = formatAppointmentInfo(payload);
      addNotification("assigned", msg, info);
      setToast({ type: "assigned", message: msg, appointmentInfo: info });
      window.dispatchEvent(
        new CustomEvent("appointment-notification", {
          detail: { type: "appointment_assigned", payload },
        }),
      );
    },
  });

  const unreadCount = state.items.filter((n) => !n.read).length;

  return (
    <AppointmentNotificationContext.Provider
      value={{
        toast,
        notifications: state.items,
        unreadCount,
        markAllAsRead,
        markAsRead,
        clearAll,
      }}
    >
      {children}
      {toast && (
        <div className="appointment-toast" role="alert" aria-live="polite">
          <span className="appointment-toast-icon">
            {toast.type === "waiting_assign" ? "📋" : "✅"}
          </span>
          <div className="appointment-toast-content">
            <span className="appointment-toast-message">{toast.message}</span>
            {toast.appointmentInfo && (
              <span className="appointment-toast-info">{toast.appointmentInfo}</span>
            )}
          </div>
          <a
            href="/appointments"
            className="appointment-toast-link"
            onClick={() => markAllAsRead()}
          >
            Xem ngay
          </a>
        </div>
      )}
    </AppointmentNotificationContext.Provider>
  );
}

/**
 * Provider: chỉ kích hoạt socket + toast khi user đã đăng nhập.
 */
export function AppointmentNotificationProvider({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return (
    <AppointmentNotificationInner user={user}>{children}</AppointmentNotificationInner>
  );
}

export function useAppointmentNotification() {
  const ctx = useContext(AppointmentNotificationContext);
  return ctx;
}

/**
 * Hook: lắng nghe event từ provider để refresh khi có thông báo mới.
 * Dùng trong SaleStaffAppointmentDashboard, Appointments, DoctorAppointmentDashboard.
 */
export function useAppointmentNotificationRefresh({ onWaitingAssign, onAssigned }) {
  const onWaitingAssignRef = React.useRef(onWaitingAssign);
  const onAssignedRef = React.useRef(onAssigned);
  React.useEffect(() => {
    onWaitingAssignRef.current = onWaitingAssign;
    onAssignedRef.current = onAssigned;
  }, [onWaitingAssign, onAssigned]);

  useEffect(() => {
    const handler = (e) => {
      const { type } = e.detail || {};
      if (type === "appointment_waiting_assign") onWaitingAssignRef.current?.();
      if (type === "appointment_assigned") onAssignedRef.current?.();
    };
    window.addEventListener("appointment-notification", handler);
    return () => window.removeEventListener("appointment-notification", handler);
  }, []);
}
