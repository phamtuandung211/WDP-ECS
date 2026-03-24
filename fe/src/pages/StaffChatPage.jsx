import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";

export function StaffChatPage() {
  const {
    connected,
    staffSessions,
    activeStaffSession,
    staffMessages,
    pendingAlert,
    setPendingAlert,
    loadStaffSessions,
    openStaffSession,
    sendStaffMessage,
    closeStaffSession,
    staffOtherTyping,
    sendTyping,
    sendStopTyping,
  } = useChat();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadStaffSessions();
  }, [loadStaffSessions]);

  // Reload when new session needs support
  useEffect(() => {
    if (pendingAlert) {
      loadStaffSessions();
      setPendingAlert(null);
    }
  }, [pendingAlert, loadStaffSessions, setPendingAlert]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [staffMessages, staffOtherTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (activeStaffSession) {
      if (val.trim()) {
        sendTyping(activeStaffSession);
      } else {
        sendStopTyping(activeStaffSession);
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    sendStopTyping(activeStaffSession);

    setSending(true);
    try {
      await sendStaffMessage(input.trim());
      setInput("");
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Bạn có chắc muốn đóng phiên chat này?")) return;
    try {
      await closeStaffSession();
    } catch (err) {
      console.error("Failed to close:", err);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN") + " " + formatTime(dateStr);
  };

  return (
    <div className="staff-chat-page">
      <h1 className="staff-chat-title">Chat Hỗ Trợ Khách Hàng</h1>
      <div className="staff-chat-status">
        <span className={`status-dot ${connected ? "online" : "offline"}`} />
        {connected ? "Đã kết nối" : "Mất kết nối"}
      </div>

      <div className="staff-chat-layout">
        {/* Session list */}
        <div className="staff-chat-sidebar">
          <div className="staff-chat-sidebar-header">
            <h3>Phiên chat ({staffSessions.length})</h3>
            <button
              className="staff-chat-refresh"
              onClick={loadStaffSessions}
              title="Làm mới"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>

          {staffSessions.length === 0 ? (
            <div className="staff-chat-empty">Không có phiên chat nào</div>
          ) : (
            <div className="staff-chat-list">
              {staffSessions.map((s) => (
                <div
                  key={s._id}
                  className={`staff-chat-item ${activeStaffSession === s._id ? "active" : ""}`}
                  onClick={() => openStaffSession(s._id)}
                >
                  <div className="staff-chat-item-name">
                    {s.customerId?.fullName || "Khách hàng"}
                  </div>
                  <div className="staff-chat-item-info">
                    {s.customerId?.phone || ""}
                  </div>
                  <div className="staff-chat-item-meta">
                    <span
                      className={`staff-chat-badge ${s.assignedStaffId ? "assigned" : "unassigned"}`}
                    >
                      {s.assignedStaffId ? "Đã nhận" : "Chờ xử lý"}
                    </span>
                    <span className="staff-chat-item-time">
                      {formatDate(s.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="staff-chat-main">
          {!activeStaffSession ? (
            <div className="staff-chat-placeholder">
              Chọn một phiên chat để bắt đầu hỗ trợ
            </div>
          ) : (
            <>
              <div className="staff-chat-main-header">
                <span>Phiên chat</span>
                <button className="staff-chat-close-btn" onClick={handleClose}>
                  Đóng phiên
                </button>
              </div>

              <div className="staff-chat-messages">
                {staffMessages.map((msg, idx) => (
                  <div
                    key={msg._id || idx}
                    className={`chat-msg ${msg.sender === "STAFF" ? "chat-msg-customer" : "chat-msg-other"}`}
                  >
                    <div className="chat-msg-label">
                      {msg.sender === "CUSTOMER"
                        ? "Khách hàng"
                        : msg.sender === "AI"
                          ? "AI"
                          : "Bạn"}
                    </div>
                    <div className="chat-msg-bubble">{msg.content}</div>
                    {msg.createdAt && (
                      <div className="chat-msg-time">
                        {formatTime(msg.createdAt)}
                      </div>
                    )}
                  </div>
                ))}
                {staffOtherTyping && (
                  <div className="chat-msg chat-msg-other">
                    <div className="chat-msg-label">Khách hàng</div>
                    <div className="chat-msg-bubble chat-typing-indicator">
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="staff-chat-input" onSubmit={handleSend}>
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Nhập tin nhắn phản hồi..."
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="staff-chat-send"
                >
                  Gửi
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
