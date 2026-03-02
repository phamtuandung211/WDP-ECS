import React from "react";

/**
 * Form tìm kiếm: input + nút "Tìm kiếm"
 * @param {string} placeholder
 * @param {string} defaultValue
 * @param {(e: React.FormEvent) => void} onSubmit - form submit (e.target.search?.value)
 */
export function SearchForm({
  placeholder = "Tìm kiếm...",
  defaultValue = "",
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        name="search"
        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tìm kiếm
      </button>
    </form>
  );
}
