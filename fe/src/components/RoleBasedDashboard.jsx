import React from "react";
import { useAuth } from "../context/AuthContext";
import { Alert, Loading } from "./UI";
import { Appointments } from "../pages/Appointments";
import { SaleStaffAppointmentDashboard } from "./staff/SaleStaffAppointmentDashboard";
import { DoctorAppointmentDashboard } from "./doctor/DoctorAppointmentDashboard";
import { AdminStatisticsDashboard } from "./admin/AdminStatisticsDashboard";

const ROLE_NAMES = {
  CUSTOMER: "CUSTOMER",
  SALE_STAFF: "SALE_STAFF",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
};

/**
 * RoleBasedDashboard Component
 * Routes to the appropriate dashboard based on user's role
 */
export function RoleBasedDashboard() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  if (!user) {
    return (
      <Alert type="warning">
        <div className="text-center">
          <p className="mb-3">Please log in to access your dashboard</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </Alert>
    );
  }

  // Get user role - handle different response formats
  const userRole = user.role || user.roleName || user.roleId;

  switch (userRole) {
    case ROLE_NAMES.CUSTOMER:
      return <Appointments />;

    case ROLE_NAMES.SALE_STAFF:
      return <SaleStaffAppointmentDashboard />;

    case ROLE_NAMES.DOCTOR:
      return <DoctorAppointmentDashboard />;

    case ROLE_NAMES.ADMIN:
      return <AdminStatisticsDashboard />;

    default:
      return (
        <Alert type="error">
          Unknown role: {userRole}. Please contact support.
        </Alert>
      );
  }
}

export default RoleBasedDashboard;
