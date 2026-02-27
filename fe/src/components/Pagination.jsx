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
    <div className="pagination">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page <= 1}
        onClick={onPrev}
      >
        Trước
      </button>
      <span className="pagination-info">
        Trang {page} / {totalPages} (tổng {total ?? 0})
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Sau
      </button>
    </div>
  );
}
