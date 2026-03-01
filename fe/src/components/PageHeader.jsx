import React from "react";
import { Link } from "react-router-dom";

/**
 * Header trang: link quay lại + tiêu đề + (tùy chọn) nút/link bên phải
 * @param {string} backTo - URL quay lại
 * @param {string} backLabel - text link (vd: "← Dashboard")
 * @param {string} title - tiêu đề trang
 * @param {React.ReactNode} action - nút/link bên phải (vd: "Thêm mới")
 */
export function PageHeader({ backTo, backLabel, title, action }) {
  return (
    <div className="page-header">
      <div>
        {backTo && (
          <Link to={backTo} className="back-link">
            {backLabel}
          </Link>
        )}
        <h1 className="page-title">{title}</h1>
      </div>
      {action}
    </div>
  );
}
