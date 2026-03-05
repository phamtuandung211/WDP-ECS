import React from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE_NAME } from "../constants/role";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=4361ee&color=fff&size=64";

export function Header() {
  const { user, logout } = useAuth();

  const role = user?.role;
  const isSaleStaff = role === ROLE_NAME.SALE_STAFF;
  const isAdmin = role === "ADMIN";

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
                <a href="/appointments">📋 My Dashboard</a>
                <span className="user-info">
                  Xin chào, {getUserName()} ({user.role})
                </span>
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
                <a href="/profile">Hồ sơ cá nhân</a>

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
