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
import { Forbidden } from "./pages/Forbidden";
import { ROLE_NAME } from "./constants/role";
import "./styles.css";

function ProtectedRoute({ element }) {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" />;
}

function RoleProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return element;
  const role = user?.role;
  return allowedRoles.includes(role) ? element : <Navigate to="/403" />;
}

function App() {
  const staffRoles = [ROLE_NAME.SALE_STAFF, ROLE_NAME.ADMIN];
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
            <Route path="/403" element={<Forbidden />} />
            <Route
              path="/staff/dashboard"
              element={<RoleProtectedRoute allowedRoles={staffRoles} element={<SaleStaffDashboard />} />}
            />
            <Route
              path="/staff/manage-services"
              element={<RoleProtectedRoute allowedRoles={staffRoles} element={<ManageServiceList />} />}
            />
            <Route
              path="/staff/manage-services/:id"
              element={<RoleProtectedRoute allowedRoles={staffRoles} element={<ManageServiceForm />} />}
            />
            <Route
              path="/staff/manage-blogs"
              element={<RoleProtectedRoute allowedRoles={staffRoles} element={<ManageBlogList />} />}
            />
            <Route
              path="/staff/manage-blogs/:id"
              element={<RoleProtectedRoute allowedRoles={staffRoles} element={<ManageBlogForm />} />}
            />
            <Route
              path="/appointments"
              element={<ProtectedRoute element={<Appointments />} />}
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
