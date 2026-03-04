import React from "react";
import { Link } from "react-router-dom";

export function Forbidden() {
  return (
    <div className="page">
      <h1 className="page-title">403 - Không có quyền truy cập</h1>
      <p className="text-muted" style={{ marginTop: 8 }}>
        Tài khoản của bạn không được phép mở màn hình này.
      </p>
      <div style={{ marginTop: 16 }}>
        <Link to="/" className="btn btn-secondary">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

