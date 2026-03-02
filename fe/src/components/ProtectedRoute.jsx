import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * <ProtectedRoute allowedRoles={["CUSTOMER","SALE_STAFF"]} element={<Page />} />
 * - nếu user chưa đăng nhập sẽ redirect về /login
 * - nếu allowedRoles tồn tại và user.role không thuộc thì chuyển về trang chủ
 */
export function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return element;
}
