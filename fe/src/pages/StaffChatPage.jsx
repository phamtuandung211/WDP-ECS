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
  }, [staffMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

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
    if (!window.confirm("Ban co chac muon dong phien chat nay?")) return;
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
      <h1 className="staff-chat-title">Chat Ho Tro Khach Hang</h1>
      <div className="staff-chat-status">
        <span className={`status-dot ${connected ? "online" : "offline"}`} />
        {connected ? "Da ket noi" : "Mat ket noi"}
      </div>

      <div className="staff-chat-layout">
        {/* Session list */}
        <div className="staff-chat-sidebar">
          <div className="staff-chat-sidebar-header">
            <h3>Phien chat ({staffSessions.length})</h3>
            <button
              className="staff-chat-refresh"
              onClick={loadStaffSessions}
              title="Lam moi"
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
            <div className="staff-chat-empty">Khong co phien chat nao</div>
          ) : (
            <div className="staff-chat-list">
              {staffSessions.map((s) => (
                <div
                  key={s._id}
                  className={`staff-chat-item ${activeStaffSession === s._id ? "active" : ""}`}
                  onClick={() => openStaffSession(s._id)}
                >
                  <div className="staff-chat-item-name">
                    {s.customerId?.fullName || "Khach hang"}
                  </div>
                  <div className="staff-chat-item-info">
                    {s.customerId?.phone || ""}
                  </div>
                  <div className="staff-chat-item-meta">
                    <span
                      className={`staff-chat-badge ${s.assignedStaffId ? "assigned" : "unassigned"}`}
                    >
                      {s.assignedStaffId ? "Da nhan" : "Cho xu ly"}
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
              Chon mot phien chat de bat dau ho tro
            </div>
          ) : (
            <>
              <div className="staff-chat-main-header">
                <span>Phien chat</span>
                <button className="staff-chat-close-btn" onClick={handleClose}>
                  Dong phien
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
                        ? "Khach hang"
                        : msg.sender === "AI"
                          ? "AI"
                          : "Ban"}
                    </div>
                    <div className="chat-msg-bubble">{msg.content}</div>
                    {msg.createdAt && (
                      <div className="chat-msg-time">
                        {formatTime(msg.createdAt)}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="staff-chat-input" onSubmit={handleSend}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhap tin nhan phan hoi..."
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="staff-chat-send"
                >
                  Gui
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
