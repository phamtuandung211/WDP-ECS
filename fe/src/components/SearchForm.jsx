import React from "react";

/**
 * Form tìm kiếm: input + nút "Tìm kiếm"
 * @param {string} placeholder
 * @param {string} defaultValue
 * @param {(e: React.FormEvent) => void} onSubmit - form submit (e.target.search?.value)
 */
export function SearchForm({ placeholder = "Tìm kiếm...", defaultValue = "", onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="search-form">
      <input
        type="text"
        name="search"
        className="form-input search-input"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
      <button type="submit" className="btn btn-secondary">
        Tìm kiếm
      </button>
    </form>
  );
}
