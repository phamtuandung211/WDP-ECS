import React from "react";

/**
 * Pagination: Trước / Sau + "Trang x / y (tổng z)"
 * @param {number} page - trang hiện tại
 * @param {number} totalPages - tổng số trang
 * @param {number} total - tổng số mục
 * @param {() => void} onPrev - khi bấm Trước
 * @param {() => void} onNext - khi bấm Sau
 */
export function Pagination({ page, totalPages, total, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 my-4">
      <button
        type="button"
        className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={page <= 1}
        onClick={onPrev}
      >
        Trước
      </button>
      <span className="text-gray-700">
        Trang {page} / {totalPages} (tổng {total ?? 0})
      </span>
      <button
        type="button"
        className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Sau
      </button>
    </div>
  );
}
