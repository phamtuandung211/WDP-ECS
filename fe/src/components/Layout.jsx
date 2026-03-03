import React from "react";
import { useAuth } from "../context/AuthContext";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=4361ee&color=fff&size=64";

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const avatarSrc = user?.avatar
    ? user.avatar
    : `${DEFAULT_AVATAR}&name=${encodeURIComponent(user?.fullName || user?.name || user?.email || "U")}`;

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">WDP-ECS</h1>
        <nav className="nav">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/blogs">Blogs</a>
          <a href="/doctors">Doctors</a>
          {user ? (
            <>
              <a href="/staff/dashboard">Dashboard</a>
              <a href="/appointments">Cuộc hẹn</a>
              <a href="/medical-records">Hồ sơ bệnh án</a>
              <a href="/feedbacks">Đánh giá</a>
              <a href="/profile">Hồ sơ cá nhân</a>
              {user.role === "ADMIN" && (
                <a href="/admin/statistics">📊 Thống kê</a>
              )}
              <span className="user-info">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="header-avatar"
                  onError={(e) => {
                    e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(
                      user?.fullName || user?.name || user?.email || "U"
                    )}`;
                  }}
                />
                Xin chào, {user.fullName || user.name || user.email}
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <a href="/login">Login</a>
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
