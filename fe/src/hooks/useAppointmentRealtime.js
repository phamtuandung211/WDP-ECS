import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

export function useAppointmentRealtime({ onWaitingAssign, onAssigned }) {
  const onWaitingAssignRef = useRef(onWaitingAssign);
  const onAssignedRef = useRef(onAssigned);

  useEffect(() => {
    onWaitingAssignRef.current = onWaitingAssign;
  }, [onWaitingAssign]);

  useEffect(() => {
    onAssignedRef.current = onAssigned;
  }, [onAssigned]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      socket.emit("sync_appointment_notifications", () => {});
    });

    socket.on("appointment_waiting_assign", (payload) => {
      onWaitingAssignRef.current?.(payload);
    });

    socket.on("appointment_assigned", (payload) => {
      onAssignedRef.current?.(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
