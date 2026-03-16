import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppointmentNotification } from "../context/AppointmentNotificationContext";
import { ROLE_NAME } from "../constants/role";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=4361ee&color=fff&size=64";

function NotificationIcon() {
  const {
    unreadCount = 0,
    notifications = [],
    markAllAsRead,
    markAsRead,
    clearAll,
  } = useAppointmentNotification() || {};
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, [open]);

  return (
    <div className="header-notification-wrap" ref={ref}>
      <button
        type="button"
        className="header-notification-icon"
        title="Thông báo lịch hẹn"
        aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ""}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="header-notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="header-notification-dropdown">
          <div className="header-notification-dropdown-header">
            <span>Thông báo</span>
            {notifications.length > 0 && (
              <div className="header-notification-dropdown-actions">
                <button
                  type="button"
                  className="header-notification-btn"
                  onClick={() => {
                    markAllAsRead?.();
                    setOpen(false);
                  }}
                >
                  Đã đọc
                </button>
                <button
                  type="button"
                  className="header-notification-btn"
                  onClick={() => {
                    clearAll?.();
                    setOpen(false);
                  }}
                >
                  Xóa hết
                </button>
              </div>
            )}
          </div>

          <div className="header-notification-dropdown-list">
            {notifications.length === 0 ? (
              <div className="header-notification-empty">
                Không có thông báo
              </div>
            ) : (
              notifications.map((n) => (
                <a
                  key={n.id}
                  href="/appointments"
                  className={`header-notification-item ${n.read ? "is-read" : ""}`}
                  onClick={() => {
                    if (!n.read) markAsRead?.(n.id);
                    setOpen(false);
                  }}
                >
                  <span className="header-notification-item-icon">
                    {n.type === "waiting_assign" ? "📋" : "✅"}
                  </span>
                  <div className="header-notification-item-content">
                    <span className="header-notification-item-text">
                      {n.message}
                    </span>
                    {n.appointmentInfo && (
                      <span className="header-notification-item-info">
                        {n.appointmentInfo}
                      </span>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, logout } = useAuth();

  const role = user?.role;
  const isSaleStaff = role === ROLE_NAME.SALE_STAFF;
  const isCustomerSupport = role === ROLE_NAME.CUSTOMER_SUPPORT;
  const isAdmin = role === "ADMIN";
  const isDoctor = role === ROLE_NAME.DOCTOR;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const getUserName = () => user?.fullName || user?.name || user?.email || "U";

  const avatarSrc = user?.avatar
    ? user.avatar
    : `${DEFAULT_AVATAR}&name=${encodeURIComponent(getUserName())}`;

  return (
    <header className="header">
      <div className="container">
        <a href={isSaleStaff ? "/staff/dashboard" : "/"} className="logo">
          WDP-ECS
        </a>
        <nav className="nav">
          {user ? (
            // TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP
            isSaleStaff ? (
              /* 1. Giao diện dành riêng cho SALE STAFF */
              <>
                <a href="/staff/manage-services">Manage Services</a>
                <a href="/staff/manage-blogs">Manage Blogs</a>
                <a href="/staff/manage-specializations">
                  Manage Specializations
                </a>
                <a href="/staff/review-approvals">✅ Duyệt hồ sơ</a>

                <a href="/appointments">📋 My Dashboard</a>

                <NotificationIcon />
                <Link to="/profile" className="header-user-link">
                  <span className="user-info">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="header-avatar"
                      onError={(e) => {
                        e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(getUserName())}`;
                      }}
                    />
                    Xin chào, {getUserName()} ({user.role})
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : isCustomerSupport ? (
              /* 2. Giao diện dành riêng cho CUSTOMER SUPPORT */
              <>
                <a href="/support/chat">Chat Ho Tro</a>
                <Link to="/profile" className="header-user-link">
                  <span className="user-info">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="header-avatar"
                      onError={(e) => {
                        e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(getUserName())}`;
                      }}
                    />
                    Xin chào, {getUserName()} ({user.role})
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              /* 2. Giao diện dành cho USER THƯỜNG hoặc DOCTOR hoặc ADMIN */
              <>
                <a href="/">Home</a>
                <a href="/services">Services</a>
                <a href="/blogs">Blogs</a>
                <a href="/doctors">Doctors</a>
                <a href="/appointments">📋 My Dashboard</a>
                <a href="/medical-records">Hồ sơ bệnh án</a>
                <a href="/feedbacks">Đánh giá</a>
                {isAdmin && <a href="/admin/statistics">📊 Thống kê</a>}
                <NotificationIcon />
                <Link to="/profile" className="header-user-link">
                  <span className="user-info">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="header-avatar"
                      onError={(e) => {
                        e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(getUserName())}`;
                      }}
                    />
                    Xin chào, {getUserName()}
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            )
          ) : (
            // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP (GUEST)
            <>
              <a href="/">Home</a>
              <a href="/services">Services</a>
              <a href="/blogs">Blogs</a>
              <a href="/doctors">Doctors</a>
              <a href="/login">Login</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2026 WDP-ECS. All rights reserved.</p>
    </footer>
  );
}
