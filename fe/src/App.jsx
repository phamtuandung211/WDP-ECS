import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header, Footer } from "./components/Layout";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { ServiceDetail } from "./pages/ServiceDetail";
import { Blogs } from "./pages/Blogs";
import { BlogDetail } from "./pages/BlogDetail";
import { LoginPage } from "./pages/Login";
import { Register } from "./pages/Register";
import { Verify } from "./pages/Verify";
import { VerifySuccess } from "./pages/VerifySuccess";
import { SaleStaffDashboard } from "./pages/SaleStaffDashboard";
import { ManageServiceList } from "./pages/ManageServiceList";
import { ManageServiceForm } from "./pages/ManageServiceForm";
import { ManageBlogList } from "./pages/ManageBlogList";
import { ManageBlogForm } from "./pages/ManageBlogForm";
import { ProfilePage } from "./pages/ProfilePage";
import { MedicalRecordsPage } from "./pages/MedicalRecordsPage";
import { FeedbacksPage } from "./pages/FeedbacksPage";
import { Forbidden } from "./pages/Forbidden";
import { ManageSpecializations } from "./pages/ManageSpecializations";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentReturnPage } from "./pages/PaymentReturnPage";
import { ROLE_NAME } from "./constants/role";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import { ChatProvider } from "./context/ChatContext";
import { ChatWidget } from "./components/chat/ChatWidget";
import { StaffChatPage } from "./pages/StaffChatPage";
import "./styles.css";
import DoctorListPage from "./pages/ListDoctors";
import DoctorDetailPage from "./pages/DoctorDetail";

/**
 * PrivateRoute - Bảo vệ route, yêu cầu user đã login
 * Được sử dụng cho RoleBasedDashboard (Option 3)
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-center">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Kiểm tra role hợp lệ (bảo mật 2 lớp)
  const validRoles = [
    "CUSTOMER",
    ROLE_NAME.SALE_STAFF,
    ROLE_NAME.DOCTOR,
    "ADMIN",
  ];
  const userRole = user.role || user.roleName;

  if (!validRoles.includes(userRole)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

/**
 * ProtectedRoute - Legacy, vẫn dùng cho các route khác
 */
function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" />;
  return element;
}

/**
 * RoleProtectedRoute - Bảo vệ route theo role, kiểm tra role hợp lệ
 */
function RoleProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return element;
  const role = user?.role;
  return allowedRoles.includes(role) ? element : <Navigate to="/403" />;
}

function App() {
  const staffRoles = [ROLE_NAME.SALE_STAFF];
  const supportRoles = [ROLE_NAME.CUSTOMER_SUPPORT];
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            {/* ========== Public Routes ========== */}
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/success" element={<VerifySuccess />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/doctors" element={<DoctorListPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route path="/403" element={<Forbidden />} />

            {/* ========== Protected Routes - Staff Management ========== */}
            <Route
              path="/staff/dashboard"
              element={
                <RoleProtectedRoute
                  allowedRoles={staffRoles}
                  element={<SaleStaffDashboard />}
                />
              }
            />
            <Route
              path="/staff/manage-services"
              element={
                <RoleProtectedRoute
                  allowedRoles={staffRoles}
                  element={<ManageServiceList />}
                />
              }
            />
            <Route
              path="/staff/manage-services/:id"
              element={
                <RoleProtectedRoute
                  allowedRoles={staffRoles}
                  element={<ManageServiceForm />}
                />
              }
            />
            <Route
              path="/staff/manage-blogs"
              element={
                <RoleProtectedRoute
                  allowedRoles={staffRoles}
                  element={<ManageBlogList />}
                />
              }
            />
            <Route
              path="/staff/manage-blogs/:id"
              element={
                <RoleProtectedRoute
                  allowedRoles={staffRoles}
                  element={<ManageBlogForm />}
                />
              }
            />
            <Route
              path="/staff/manage-specializations"
              element={
                <RoleProtectedRoute
                  allowedRoles={staffRoles}
                  element={<ManageSpecializations />}
                />
              }
            />

            {/* ========== Protected Routes - User Features ========== */}
            <Route
              path="/profile"
              element={<ProtectedRoute element={<ProfilePage />} />}
            />
            <Route
              path="/medical-records"
              element={<ProtectedRoute element={<MedicalRecordsPage />} />}
            />
            <Route
              path="/feedbacks"
              element={<ProtectedRoute element={<FeedbacksPage />} />}
            />

            {/* ========== Role-Based Dashboard (Option 3) ========== */}
            {/* 
              Tất cả 4 roles (CUSTOMER, SALE_STAFF, DOCTOR, ADMIN)
              dùng chung URL /appointments
              RoleBasedDashboard sẽ tự detect role và render dashboard phù hợp
            */}
            <Route
              path="/appointments"
              element={
                <PrivateRoute>
                  <RoleBasedDashboard />
                </PrivateRoute>
              }
            />

            {/* Alias route để tiện */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <RoleBasedDashboard />
                </PrivateRoute>
              }
            />

            {/* ========== Payment Routes ========== */}
            <Route
              path="/payment"
              element={
                <PrivateRoute>
                  <PaymentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment/return"
              element={
                <PrivateRoute>
                  <PaymentReturnPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment/success"
              element={
                <PrivateRoute>
                  <PaymentReturnPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment/cancel"
              element={
                <PrivateRoute>
                  <PaymentReturnPage />
                </PrivateRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ChatProvider>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/verify/success" element={<VerifySuccess />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:id" element={<BlogDetail />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/403" element={<Forbidden />} />
              <Route
                path="/staff/dashboard"
                element={
                  <RoleProtectedRoute
                    allowedRoles={staffRoles}
                    element={<SaleStaffDashboard />}
                  />
                }
              />
              <Route
                path="/staff/manage-services"
                element={
                  <RoleProtectedRoute
                    allowedRoles={staffRoles}
                    element={<ManageServiceList />}
                  />
                }
              />
              <Route
                path="/staff/manage-services/:id"
                element={
                  <RoleProtectedRoute
                    allowedRoles={staffRoles}
                    element={<ManageServiceForm />}
                  />
                }
              />
              <Route
                path="/staff/manage-blogs"
                element={
                  <RoleProtectedRoute
                    allowedRoles={staffRoles}
                    element={<ManageBlogList />}
                  />
                }
              />
              <Route
                path="/staff/manage-blogs/:id"
                element={
                  <RoleProtectedRoute
                    allowedRoles={staffRoles}
                    element={<ManageBlogForm />}
                  />
                }
              />
              <Route
                path="/appointments"
                element={<ProtectedRoute element={<Appointments />} />}
              />
              {/* New API pages */}
              <Route
                path="/profile"
                element={<ProtectedRoute element={<ProfilePage />} />}
              />
              <Route
                path="/medical-records"
                element={<ProtectedRoute element={<MedicalRecordsPage />} />}
              />
              <Route
                path="/feedbacks"
                element={<ProtectedRoute element={<FeedbacksPage />} />}
              />
              <Route
                path="/admin/statistics"
                element={
                  <ProtectedRoute
                    element={<AdminStatisticsPage />}
                    allowedRoles={["ADMIN"]}
                  />
                }
              />
              <Route
                path="/support/chat"
                element={
                  <RoleProtectedRoute
                    allowedRoles={supportRoles}
                    element={<StaffChatPage />}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
              {/* Route doctor */}
              <Route path="/doctors" element={<DoctorListPage />} />
              <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            </Routes>
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
