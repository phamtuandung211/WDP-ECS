import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { ROLE_NAME } from "../../constants/role";

export function ChatWidget() {
  const { user } = useAuth();
  const {
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
    otherTyping,
    sendTyping,
    sendStopTyping,
  } = useChat();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const isCustomer = user?.role === ROLE_NAME.CUSTOMER;

  const handleOpen = async () => {
    setOpen(true);
    if (!session) {
      try {
        await startSession();
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping, otherTyping]);

  useEffect(() => {
    const openFromOutside = () => {
      handleOpen();
    };

    globalThis.addEventListener("open-eyecare-chat", openFromOutside);
    return () => {
      globalThis.removeEventListener("open-eyecare-chat", openFromOutside);
    };
  }, [session, startSession]);

  // Don't render for non-customers
  if (!user || !isCustomer) return null;

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (session && mode === "SUPPORT_MODE") {
      if (val.trim()) {
        sendTyping();
      } else {
        sendStopTyping();
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    sendStopTyping();

    setSending(true);
    setShowTyping(true);
    const typingStart = Date.now();
    try {
      await sendMessage(input.trim());
      setInput("");
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
      const elapsed = Date.now() - typingStart;
      const minDisplay = 1000;
      if (elapsed >= minDisplay) {
        setShowTyping(false);
      } else {
        setTimeout(() => setShowTyping(false), minDisplay - elapsed);
      }
    }
  };

  const handleTransfer = async () => {
    try {
      if (!session) {
        await startSession();
      }
      await transferToStaff();
    } catch (err) {
      console.error("Failed to transfer:", err);
    }
  };

  const handleBackToAI = async () => {
    try {
      await transferToAI();
    } catch (err) {
      console.error("Failed to transfer to AI:", err);
    }
  };

  const handleClose = async () => {
    try {
      await closeChat();
    } catch (err) {
      console.error("Failed to close:", err);
    }
    setOpen(false);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderLabel = (sender) => {
    if (sender === "CUSTOMER") return "Bạn";
    if (sender === "AI") return "AI";
    return "Nhân viên";
  };

  // Floating button
  if (!open) {
    return (
      <button className="chat-fab" onClick={handleOpen} title="Chat hỗ trợ">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-widget-header">
        <div className="chat-widget-header-info">
          <span className="chat-widget-title">EyesCare Chat</span>
          <span
            className={`chat-widget-status ${connected ? "online" : "offline"}`}
          >
            {mode === "AI_MODE" ? "Trợ lý AI" : "Nhân viên hỗ trợ"}
          </span>
        </div>
        <div className="chat-widget-header-actions">
          {mode === "SUPPORT_MODE" && session && (
            <button
              className="chat-widget-btn-small"
              onClick={handleBackToAI}
              title="Chuyển về AI"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.93-4H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                <circle cx="9" cy="15" r="1" />
                <circle cx="15" cy="15" r="1" />
              </svg>
            </button>
          )}
          {mode === "AI_MODE" && (
            <button
              className="chat-widget-btn-small"
              onClick={handleTransfer}
              title="Kết nối nhân viên"
              disabled={loading}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
          )}
          <button
            className="chat-widget-btn-small"
            onClick={() => setOpen(false)}
            title="Thu nhỏ"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            className="chat-widget-btn-small chat-widget-btn-danger"
            onClick={handleClose}
            title="Đóng chat"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-widget-messages">
        {loading && messages.length === 0 && (
          <div className="chat-widget-loading">Đang kết nối...</div>
        )}
        {messages.length === 0 && !loading && (
          <div className="chat-widget-welcome">
            Xin chào! Tôi là trợ lý của phòng khám mắt EyesCare. Tôi có thể giúp
            gì cho bạn?
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`chat-msg ${msg.sender === "CUSTOMER" ? "chat-msg-customer" : "chat-msg-other"}`}
          >
            <div className="chat-msg-label">{getSenderLabel(msg.sender)}</div>
            <div className="chat-msg-bubble">{msg.content}</div>
            {msg.createdAt && (
              <div className="chat-msg-time">{formatTime(msg.createdAt)}</div>
            )}
          </div>
        ))}
        {(showTyping || otherTyping) && (
          <div className="chat-msg chat-msg-other">
            <div className="chat-msg-label">
              {mode === "AI_MODE" ? "AI" : "Nhân viên"}
            </div>
            <div className="chat-msg-bubble chat-typing-indicator">
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-widget-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={
            mode === "SUPPORT_MODE" && !sending
              ? "Nhắn tin cho nhân viên..."
              : "Nhập tin nhắn..."
          }
          disabled={sending || !session}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || !session}
          className="chat-widget-send"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
