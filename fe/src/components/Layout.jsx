import React from "react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="bg-green-600 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="WDP-ECS logo"
            className="h-10 object-contain"
          />
          <span className="ml-2 font-bold text-xl text-white">WDP-ECS</span>
        </a>
        <nav className="flex space-x-4 items-center text-white">
          <a href="/" className="hover:text-green-200">
            Home
          </a>
          <a href="/services" className="hover:text-green-200">
            Services
          </a>
          <a href="/blogs" className="hover:text-green-200">
            Blogs
          </a>
          <a href="/doctors" className="hover:text-green-200">
            Doctors
          </a>
          {user ? (
            <>
              <a href="/staff/dashboard" className="hover:text-green-200">
                Dashboard
              </a>
              <a href="/appointments" className="hover:text-green-200">
                Appointments
              </a>
              <span className="ml-4 text-sm">
                Xin chào, {user.fullName || user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <a href="/login" className="hover:text-green-200">
              Login
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PageFooter() {
  return (
    <footer className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
        &copy; 2026 WDP-ECS. All rights reserved.
      </div>
    </footer>
  );
}
