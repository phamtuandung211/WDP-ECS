import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header, Footer } from "./components/Layout";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { ServiceDetail } from "./pages/ServiceDetail";
import { Blogs } from "./pages/Blogs";
import { LoginPage } from "./pages/Login";
import { Appointments } from "./pages/Appointments";
import { SaleStaffDashboard } from "./pages/SaleStaffDashboard";
import { ManageServiceList } from "./pages/ManageServiceList";
import { ManageServiceForm } from "./pages/ManageServiceForm";
import { ManageBlogList } from "./pages/ManageBlogList";
import { ManageBlogForm } from "./pages/ManageBlogForm";
import "./styles.css";

function ProtectedRoute({ element }) {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" />;
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
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/blogs" element={<Blogs />} />
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
