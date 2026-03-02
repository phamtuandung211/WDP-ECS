import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white shadow rounded p-4 ${className}`}>{children}</div>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-gray-700 mb-1">{label}</label>}
      <input
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        {...props}
      />
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center items-center py-8">
      <svg
        className="animate-spin h-8 w-8 text-green-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
    </div>
  );
}

export function Alert({ type, children }) {
  const base = "p-3 rounded mb-4 text-white";
  let color = "bg-green-500";
  if (type === "error") color = "bg-red-500";
  if (type === "warning") color = "bg-yellow-500 text-black";
  return <div className={`${base} ${color}`}>{children}</div>;
}
