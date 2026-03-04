import React from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE_NAME } from "../constants/role";

export function Header() {
  const { user, logout } = useAuth();

  const role = user?.role;
  const isSaleStaff = role === ROLE_NAME.SALE_STAFF;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="header">
      <div className="container">
        <a
          href={isSaleStaff ? "/staff/dashboard" : "/"}
          className="logo"
        >
          WDP-ECS
        </a>
        <nav className="nav">
          {!isSaleStaff && (
            <>
              <a href="/">Home</a>
              <a href="/services">Services</a>
              <a href="/blogs">Blogs</a>
              <a href="/doctors">Doctors</a>
            </>
          )}
          {user ? (
            isSaleStaff ? (
              <>
                <a href="/staff/manage-services">Manage Services</a>
                <a href="/staff/manage-blogs">Manage Blogs</a>
                <span className="user-info">
                  Xin chào, {user.fullName || user.name || user.email}{" "}
                  ({user.role})
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/appointments">Appointments</a>
                <span className="user-info">
                  Xin chào, {user.fullName || user.name || user.email}
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            )
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
