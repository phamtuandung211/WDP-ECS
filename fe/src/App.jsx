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
import { Appointments } from "./pages/Appointments";
import { SaleStaffDashboard } from "./pages/SaleStaffDashboard";
import { ManageServiceList } from "./pages/ManageServiceList";
import { ManageServiceForm } from "./pages/ManageServiceForm";
import { ManageBlogList } from "./pages/ManageBlogList";
import { ManageBlogForm } from "./pages/ManageBlogForm";
import { ProfilePage } from "./pages/ProfilePage";
import { MedicalRecordsPage } from "./pages/MedicalRecordsPage";
import { FeedbacksPage } from "./pages/FeedbacksPage";
import { AdminStatisticsPage } from "./pages/AdminStatisticsPage";
import "./styles.css";

function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return element;
}

function App() {
  return (
    <AuthProvider>
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
            <Route
              path="/staff/dashboard"
              element={<ProtectedRoute element={<SaleStaffDashboard />} />}
            />
            <Route
              path="/staff/manage-services"
              element={<ProtectedRoute element={<ManageServiceList />} />}
            />
            <Route
              path="/staff/manage-services/:id"
              element={<ProtectedRoute element={<ManageServiceForm />} />}
            />
            <Route
              path="/staff/manage-blogs"
              element={<ProtectedRoute element={<ManageBlogList />} />}
            />
            <Route
              path="/staff/manage-blogs/:id"
              element={<ProtectedRoute element={<ManageBlogForm />} />}
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
