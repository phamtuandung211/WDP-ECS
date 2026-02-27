import React from "react";

/**
 * Empty state khi danh sách trống
 * @param {string} message - ví dụ "Chưa có gói dịch vụ nào."
 * @param {string} className - class bọc (vd: "services-empty", "blogs-empty")
 */
export function EmptyState({ message, className = "" }) {
  return <p className={className || "empty-state"}>{message}</p>;
}
