import React from "react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="max-w-lg mx-auto text-center py-20">
        <h2 className="text-4xl font-bold mb-4">404 – Không tìm thấy trang</h2>
        <p className="mb-6">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
