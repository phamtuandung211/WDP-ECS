import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Header, PageFooter as Footer } from "./components/Layout";
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
import { Doctors } from "./pages/Doctors";
import { DoctorDetail } from "./pages/DoctorDetail";
import { NotFound } from "./pages/NotFound";
import "./styles.css";

// Component bảo vệ route, có thể truyền thêm danh sách role cho phép
function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/success" element={<VerifySuccess />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/staff/dashboard"
              element={<ProtectedRoute allowedRoles={["SALE_STAFF"]} element={<SaleStaffDashboard />} />}
            />
            <Route
              path="/staff/manage-services"
              element={<ProtectedRoute allowedRoles={["SALE_STAFF"]} element={<ManageServiceList />} />}
            />
            <Route
              path="/staff/manage-services/:id"
              element={<ProtectedRoute allowedRoles={["SALE_STAFF"]} element={<ManageServiceForm />} />}
            />
            <Route
              path="/staff/manage-blogs"
              element={<ProtectedRoute allowedRoles={["SALE_STAFF"]} element={<ManageBlogList />} />}
            />
            <Route
              path="/staff/manage-blogs/:id"
              element={<ProtectedRoute allowedRoles={["SALE_STAFF"]} element={<ManageBlogForm />} />}
            />
            <Route
              path="/appointments"
              element={<ProtectedRoute element={<Appointments />} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
