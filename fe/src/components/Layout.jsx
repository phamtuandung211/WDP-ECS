import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppointmentNotification } from "../context/AppointmentNotificationContext";
import { ROLE_NAME } from "../constants/role";
import ecsIcon from "../assets/icon/ECS-icon.jpg";

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
  const ariaLabel =
    unreadCount > 0 ? `Thong bao, ${unreadCount} chua doc` : "Thong bao";

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
        aria-label={ariaLabel}
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
  const isAdmin = role === ROLE_NAME.ADMIN;
  const isDoctor = role === ROLE_NAME.DOCTOR;

  const getLogoHref = () => {
    if (isSaleStaff) return "/staff/dashboard";
    if (isAdmin) return "/admin/statistics";
    if (isDoctor) return "/appointments";
    return "/";
  };

  const handleLogout = () => {
    logout();
    globalThis.location.href = "/";
  };

  const getUserName = () => user?.fullName || user?.name || user?.email || "U";

  const avatarSrc = user?.avatar
    ? user.avatar
    : `${DEFAULT_AVATAR}&name=${encodeURIComponent(getUserName())}`;

  const renderUserMenu = () => {
    if (isSaleStaff) {
      return (
        <>
          <a href="/staff/manage-services">Quản lý dịch vụ</a>
          <a href="/staff/manage-blogs">Quản lý bài viết</a>
          <a href="/staff/manage-specializations">Quản lý chuyên khoa</a>
          <a href="/staff/review-approvals">Duyệt hồ sơ</a>
          <a href="/appointments">Bảng điều khiển</a>
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
            Đăng xuất
          </button>
        </>
      );
    }

    if (isCustomerSupport) {
      return (
        <>
          <a href="/support/chat">Chat hỗ trợ</a>
          <a href="/feedbacks">Đánh giá</a>
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
            Đăng xuất
          </button>
        </>
      );
    }

    if (isAdmin) {
      return (
        <>
          <a href="/admin/statistics">Thống kê</a>
          {/* <a href="/appointments">Bảng điều khiển</a> */}
          <a href="/feedbacks">Đánh giá</a>
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
            Đăng xuất
          </button>
        </>
      );
    }

    if (isDoctor) {
      return (
        <>
          <a href="/appointments">Bảng điều khiển</a>
          <a href="/doctor/certificates">Chứng chỉ</a>
          <a href="/doctor/degrees">Bằng cấp</a>
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
            Đăng xuất
          </button>
        </>
      );
    }

    return (
      <>
        <a href="/">Trang chủ</a>
        <a href="/services">Dịch vụ</a>
        <a href="/blogs">Bài viết</a>
        <a href="/doctors">Bác sĩ</a>
        <a href="/appointments">Đặt lịch khám</a>
        <a href="/medical-records">Hồ sơ bệnh án</a>
        <a href="/feedbacks">Đánh giá</a>
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
          Đăng xuất
        </button>
      </>
    );
  };

  return (
    <header className="header">
      <div className="container">
        <a href={getLogoHref()} className="logo">
          WDP-ECS
        </a>
        <nav className="nav">
          {user ? (
            renderUserMenu()
          ) : (
            // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP (GUEST)
            <>
              <a href="/">Trang chủ</a>
              <a href="/services">Dịch vụ</a>
              <a href="/blogs">Bài viết</a>
              <a href="/doctors">Bác sĩ</a>
              <a href="/login">Đăng nhập</a>
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
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-brand">
            <img src={ecsIcon} alt="ECS icon" className="footer-brand-icon" />
            <span>WDP - Eye Care System</span>
          </h3>
          <p>
            Hệ thống đặt lịch khám mắt trực tuyến giúp bạn dễ dàng kết nối với
            bác sĩ và quản lý lịch hẹn mọi lúc, mọi nơi.
          </p>
        </div>

        <div className="footer-section">
          <h4>Liên hệ</h4>
          <p>Email: support@eyecare.com</p>
          <p>Hotline: 0123 456 789</p>
          <p>Địa chỉ: Hà Nội, Việt Nam</p>
        </div>

        <div className="footer-section">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li>
              <a href="/">Trang chủ</a>
            </li>
            <li>
              <a href="/doctors">Bác sĩ</a>
            </li>
            <li>
              <a href="/appointments">Đặt lịch</a>
            </li>
            <li>
              <a href="/about">Giới thiệu</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Kết nối</h4>
          <p>Facebook | Zalo | Instagram</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 WDP - Eye Care System. All rights reserved.</p>
      </div>
    </footer>
  );
}
