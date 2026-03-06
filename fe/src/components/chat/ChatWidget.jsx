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
    closeChat,
  } = useChat();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isCustomer = user?.role === ROLE_NAME.CUSTOMER;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Don't render for non-customers
  if (!user || !isCustomer) return null;

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(input.trim());
      setInput("");
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  const handleTransfer = async () => {
    try {
      await transferToStaff();
    } catch (err) {
      console.error("Failed to transfer:", err);
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

  // Floating button
  if (!open) {
    return (
      <button className="chat-fab" onClick={handleOpen} title="Chat ho tro">
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
            {mode === "AI_MODE" ? "Tro ly AI" : "Nhan vien ho tro"}
          </span>
        </div>
        <div className="chat-widget-header-actions">
          {mode === "AI_MODE" && session && (
            <button
              className="chat-widget-btn-small"
              onClick={handleTransfer}
              title="Ket noi nhan vien"
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
            title="Thu nho"
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
            title="Dong chat"
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
          <div className="chat-widget-loading">Dang ket noi...</div>
        )}
        {messages.length === 0 && !loading && (
          <div className="chat-widget-welcome">
            Xin chao! Toi la tro ly cua phong kham mat EyesCare. Toi co the giup
            gi cho ban?
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`chat-msg ${msg.sender === "CUSTOMER" ? "chat-msg-customer" : "chat-msg-other"}`}
          >
            <div className="chat-msg-label">
              {msg.sender === "CUSTOMER"
                ? "Ban"
                : msg.sender === "AI"
                  ? "AI"
                  : "Nhan vien"}
            </div>
            <div className="chat-msg-bubble">{msg.content}</div>
            {msg.createdAt && (
              <div className="chat-msg-time">{formatTime(msg.createdAt)}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-widget-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "SUPPORT_MODE" && !sending
              ? "Nhan tin cho nhan vien..."
              : "Nhap tin nhan..."
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
