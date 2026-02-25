import React from "react";
import { Link } from "react-router-dom";

export function SaleStaffDashboard() {
  return (
    <div className="page dashboard-page">
      <h1 className="dashboard-title">Sale Staff Dashboard</h1>
      <p className="dashboard-subtitle">Quản lý nội dung và dịch vụ</p>

      <div className="dashboard-grid">
        <Link to="/staff/manage-services" className="dashboard-card">
          <span className="dashboard-card-icon">📦</span>
          <h2 className="dashboard-card-title">Quản lý gói dịch vụ</h2>
          <p className="dashboard-card-desc">Xem, thêm, sửa, xóa gói dịch vụ</p>
        </Link>

        <Link to="/staff/manage-blogs" className="dashboard-card">
          <span className="dashboard-card-icon">📝</span>
          <h2 className="dashboard-card-title">Quản lý bài blog</h2>
          <p className="dashboard-card-desc">Xem, thêm, sửa, xóa bài viết</p>
        </Link>
      </div>
    </div>
  );
}
