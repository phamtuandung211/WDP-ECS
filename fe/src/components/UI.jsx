import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Input({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className="form-input" {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Loading() {
  return <div className="spinner">Loading...</div>;
}

export function Alert({ type, children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}
