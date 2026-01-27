import React from "react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">WDP-ECS</h1>
        <nav className="nav">
          <a href="/">Home</a>
          <a href="/services">Services</a>
          {user ? (
            <>
              <a href="/appointments">Appointments</a>
              <span className="user-info">{user.email}</span>
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
