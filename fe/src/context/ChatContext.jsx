import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { ROLE_NAME } from "../constants/role";

const ChatContext = createContext();

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("AI_MODE");
  const [loading, setLoading] = useState(false);

  // Staff-specific state
  const [staffSessions, setStaffSessions] = useState([]);
  const [activeStaffSession, setActiveStaffSession] = useState(null);
  const [staffMessages, setStaffMessages] = useState([]);
  const [pendingAlert, setPendingAlert] = useState(null);

  // Typing indicators from the other side
  const [otherTyping, setOtherTyping] = useState(false);
  const [staffOtherTyping, setStaffOtherTyping] = useState(false);
  const otherTypingTimeoutRef = useRef(null);
  const staffOtherTypingTimeoutRef = useRef(null);

  // Ref to track activeStaffSession for socket handlers (avoids stale closure)
  const activeStaffSessionRef = useRef(null);

  const isCustomer = user?.role === ROLE_NAME.CUSTOMER;
  const isStaff = user?.role === ROLE_NAME.CUSTOMER_SUPPORT;

  // Keep ref in sync with state
  useEffect(() => {
    activeStaffSessionRef.current = activeStaffSession;
  }, [activeStaffSession]);

  // ── Connect socket ───────────────────────────────────────────────
  useEffect(() => {
    if (!user || (!isCustomer && !isStaff)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // ── Incoming message ──────────────────────────────────────────
    socket.on("new_message", ({ sessionId, message }) => {
      if (isCustomer) {
        if (message.sender !== "CUSTOMER") setOtherTyping(false);
        setMessages((prev) => {
          const msgId = message._id?.toString();
          if (msgId && prev.some((m) => m._id?.toString() === msgId))
            return prev;
          return [...prev, message];
        });
      }
      if (isStaff) {
        if (activeStaffSessionRef.current === sessionId) {
          if (message.sender === "CUSTOMER") setStaffOtherTyping(false);
          setStaffMessages((prev) => {
            const msgId = message._id?.toString();
            if (msgId && prev.some((m) => m._id?.toString() === msgId))
              return prev;
            return [...prev, message];
          });
        }
      }
    });

    socket.on("mode_changed", ({ sessionId, mode: newMode }) => {
      if (isCustomer) {
        setMode(newMode);
      }
      if (isStaff && newMode === "AI_MODE") {
        // Customer switched back to AI — clear staff's active chat for this session
        if (activeStaffSessionRef.current === sessionId) {
          setActiveStaffSession(null);
          setStaffMessages([]);
        }
        // Remove from staff session list since it's no longer in SUPPORT_MODE
        setStaffSessions((prev) => prev.filter((s) => s._id !== sessionId));
      }
    });

    socket.on("session_needs_support", ({ sessionId, customerId }) => {
      if (isStaff) {
        setPendingAlert({ sessionId, customerId });
      }
    });

    socket.on("staff_assigned", ({ sessionId, staffId }) => {
      // Optionally update UI
    });

    socket.on("session_closed", ({ sessionId }) => {
      if (isCustomer && session?._id === sessionId) {
        setSession(null);
        setMessages([]);
      }
      if (isStaff && activeStaffSession === sessionId) {
        setActiveStaffSession(null);
        setStaffMessages([]);
      }
    });

    socket.on("user_typing", ({ sessionId, userId, role }) => {
      if (isCustomer && role !== ROLE_NAME.CUSTOMER) {
        setOtherTyping(true);
        clearTimeout(otherTypingTimeoutRef.current);
        otherTypingTimeoutRef.current = setTimeout(
          () => setOtherTyping(false),
          3000,
        );
      }
      if (
        isStaff &&
        role === ROLE_NAME.CUSTOMER &&
        activeStaffSessionRef.current === sessionId
      ) {
        setStaffOtherTyping(true);
        clearTimeout(staffOtherTypingTimeoutRef.current);
        staffOtherTypingTimeoutRef.current = setTimeout(
          () => setStaffOtherTyping(false),
          3000,
        );
      }
    });

    socket.on("user_stop_typing", ({ sessionId, userId, role }) => {
      if (isCustomer && role !== ROLE_NAME.CUSTOMER) {
        clearTimeout(otherTypingTimeoutRef.current);
        setOtherTyping(false);
      }
      if (
        isStaff &&
        role === ROLE_NAME.CUSTOMER &&
        activeStaffSessionRef.current === sessionId
      ) {
        clearTimeout(staffOtherTypingTimeoutRef.current);
        setStaffOtherTyping(false);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.role]);

  // ── Customer: start session ──────────────────────────────────────
  const startSession = useCallback(() => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) return reject(new Error("Socket not connected"));

      setLoading(true);
      socket.emit("start_session", (response) => {
        setLoading(false);
        if (response.error) return reject(new Error(response.error));
        const s = response.data;
        setSession(s);
        setMessages(s.messages || []);
        setMode(s.mode);
        socket.emit("join_session", s._id);
        resolve(s);
      });
    });
  }, []);

  // ── Customer: send message ───────────────────────────────────────
  const sendMessage = useCallback(
    (content) => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !session) return reject(new Error("No active session"));

        // Optimistic: add customer message immediately
        const optimisticMsg = {
          _id: "temp-" + Date.now(),
          sender: "CUSTOMER",
          content,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        socket.emit(
          "customer_message",
          { sessionId: session._id, content },
          (response) => {
            if (response.error) return reject(new Error(response.error));
            if (response.data.transferred) {
              setMode("SUPPORT_MODE");
            }
            resolve(response.data);
          },
        );
      });
    },
    [session],
  );

  // ── Customer: transfer to staff ──────────────────────────────────
  const transferToStaff = useCallback(() => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !session) return reject(new Error("No active session"));

      socket.emit(
        "transfer_to_staff",
        { sessionId: session._id },
        (response) => {
          if (response.error) return reject(new Error(response.error));
          setMode("SUPPORT_MODE");
          resolve(response.data);
        },
      );
    });
  }, [session]);
  // ── Customer: transfer back to AI ────────────────────────────
  const transferToAI = useCallback(() => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !session) return reject(new Error("No active session"));

      socket.emit("transfer_to_ai", { sessionId: session._id }, (response) => {
        if (response.error) return reject(new Error(response.error));
        setMode("AI_MODE");
        resolve(response.data);
      });
    });
  }, [session]);
  // ── Customer: close session ──────────────────────────────────────
  const closeChat = useCallback(() => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !session) return reject(new Error("No active session"));

      socket.emit("close_session", { sessionId: session._id }, (response) => {
        if (response.error) return reject(new Error(response.error));
        setSession(null);
        setMessages([]);
        resolve(response.data);
      });
    });
  }, [session]);

  // ── Staff: load session list ─────────────────────────────────────
  const loadStaffSessions = useCallback(async () => {
    const { chatService } = await import("../services/chatService");
    try {
      const { data } = await chatService.getStaffSessions({ status: "ACTIVE" });
      setStaffSessions(data.data || []);
    } catch (err) {
      console.error("Failed to load staff sessions:", err);
    }
  }, []);

  // ── Staff: open a session to chat ────────────────────────────────
  const openStaffSession = useCallback(async (sessionId) => {
    const { chatService } = await import("../services/chatService");
    const socket = socketRef.current;

    try {
      // Assign self
      try {
        await chatService.assignSession(sessionId);
      } catch (_) {
        // May already be assigned
      }

      const { data } = await chatService.getSession(sessionId);
      const s = data.data;
      setActiveStaffSession(sessionId);
      setStaffMessages(s.messages || []);

      if (socket) {
        socket.emit("join_session", sessionId);
      }
    } catch (err) {
      console.error("Failed to open session:", err);
    }
  }, []);

  // ── Staff: send message ──────────────────────────────────────────
  const sendStaffMessage = useCallback(
    (content) => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !activeStaffSession)
          return reject(new Error("No active session"));

        const optimisticMsg = {
          _id: "temp-" + Date.now(),
          sender: "STAFF",
          content,
          createdAt: new Date().toISOString(),
        };
        setStaffMessages((prev) => [...prev, optimisticMsg]);

        socket.emit(
          "staff_message",
          { sessionId: activeStaffSession, content },
          (response) => {
            if (response.error) return reject(new Error(response.error));
            resolve(response.data);
          },
        );
      });
    },
    [activeStaffSession],
  );

  // ── Staff: close session ─────────────────────────────────────────
  const closeStaffSession = useCallback(
    (sessionId) => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        const sid = sessionId || activeStaffSession;
        if (!socket || !sid) return reject(new Error("No session"));

        socket.emit("close_session", { sessionId: sid }, (response) => {
          if (response.error) return reject(new Error(response.error));
          setActiveStaffSession(null);
          setStaffMessages([]);
          loadStaffSessions();
          resolve(response.data);
        });
      });
    },
    [activeStaffSession, loadStaffSessions],
  );

  // ── Typing indicator ─────────────────────────────────────────────
  const sendTyping = useCallback(
    (sessionId) => {
      socketRef.current?.emit("typing", {
        sessionId: sessionId || session?._id || activeStaffSession,
      });
    },
    [session, activeStaffSession],
  );

  const sendStopTyping = useCallback(
    (sessionId) => {
      socketRef.current?.emit("stop_typing", {
        sessionId: sessionId || session?._id || activeStaffSession,
      });
    },
    [session, activeStaffSession],
  );

  const value = {
    connected,
    session,
    messages,
    mode,
    loading,
    startSession,
    sendMessage,
    transferToStaff,
    transferToAI,
    closeChat,
    // Staff
    staffSessions,
    activeStaffSession,
    staffMessages,
    pendingAlert,
    setPendingAlert,
    loadStaffSessions,
    openStaffSession,
    sendStaffMessage,
    closeStaffSession,
    // Typing
    otherTyping,
    staffOtherTyping,
    sendTyping,
    sendStopTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
