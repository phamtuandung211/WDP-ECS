# App.jsx Integration Example

This file shows how to properly integrate the RoleBasedDashboard component into your main App.jsx file.

## Option 1: Replace Existing Appointments Route

```jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import Layout from "./components/Layout";

// Other page imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes - Now using RoleBasedDashboard */}
            <Route path="/appointments" element={<RoleBasedDashboard />} />
            <Route path="/dashboard" element={<RoleBasedDashboard />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Option 2: Keep Separate Routes by Role

If you prefer explicit routing per role:

```jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Page imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard imports - from the new implementation
import { Appointments } from "./pages/Appointments";
import { SaleStaffAppointmentDashboard } from "./components/staff/SaleStaffAppointmentDashboard";
import { DoctorAppointmentDashboard } from "./components/doctor/DoctorAppointmentDashboard";
import { AdminStatisticsDashboard } from "./components/admin/AdminStatisticsDashboard";

// Protected route wrapper
function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  const userRole = user.role || user.roleName;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes by role */}
            <Route
              path="/appointments"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff/appointments"
              element={
                <ProtectedRoute allowedRoles={["SALE_STAFF"]}>
                  <SaleStaffAppointmentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={["DOCTOR"]}>
                  <DoctorAppointmentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/statistics"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminStatisticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Option 3: Dynamic Route Based on Role (Recommended)

```jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import RoleBasedDashboard from "./components/RoleBasedDashboard";

// Other imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Error404 from "./pages/404";

// Protected route wrapper
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/appointments"
        element={
          <PrivateRoute>
            <RoleBasedDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleBasedDashboard />
          </PrivateRoute>
        }
      />

      {/* Shortcut routes that also redirect to dashboard */}
      <Route
        path="/my-dashboard"
        element={
          <PrivateRoute>
            <RoleBasedDashboard />
          </PrivateRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Navbar/Layout Integration Example

```jsx
// In Layout.jsx or Navigation.jsx
import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const { user, logout } = useAuth();

  const getDashboardLink = () => {
    if (!user) return "/login";

    const role = user.role || user.roleName;
    switch (role) {
      case "CUSTOMER":
        return "/appointments";
      case "SALE_STAFF":
        return "/appointments";
      case "DOCTOR":
        return "/appointments";
      case "ADMIN":
        return "/appointments";
      default:
        return "/";
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo">
          Eye Care System
        </Link>

        {/* Menu */}
        <ul className="nav-menu">
          <li>
            <Link to="/">Home</Link>
          </li>

          {user ? (
            <>
              <li>
                <Link to={getDashboardLink()}>My Dashboard</Link>
              </li>

              <li>
                <span className="user-name">
                  Hello, {user.fullName || user.email}
                </span>
              </li>

              <li>
                <button onClick={logout} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
```

## Key Integration Points

### 1. Import Statement

```jsx
import RoleBasedDashboard from "./components/RoleBasedDashboard";
```

### 2. Route Definition

```jsx
<Route
  path="/appointments"
  element={
    <PrivateRoute>
      <RoleBasedDashboard />
    </PrivateRoute>
  }
/>
```

### 3. Navbar Link

```jsx
<Link to="/appointments">My Dashboard</Link>
```

## Important Notes

⚠️ **AuthContext must be working properly:**

- User must be logged in before accessing dashboard
- User's role must be set correctly in context
- JWT token must be stored in localStorage

⚠️ **Backend services must be accessible:**

- Ensure VITE_API_URL is set in .env
- Ensure backend is running on correct port
- Ensure JWT token is valid and not expired

⚠️ **Component requires these dependencies:**

- React Router v6+
- axios (for API calls)
- TailwindCSS or similar styling framework

## Testing Integration

```bash
# 1. Start backend
cd be && npm start

# 2. Start frontend
cd fe && npm run dev

# 3. Test in browser
# - Go to http://localhost:5173
# - Click "Login"
# - Enter customer credentials
# - Click "My Dashboard" in navbar
# - Should see customer appointment booking interface
# - Change user and verify role-based UI
```

## Troubleshooting

| Problem               | Solution                                     |
| --------------------- | -------------------------------------------- |
| Dashboard shows blank | Check AuthContext has user data              |
| 404 on route          | Check route path matches                     |
| Components not styled | Verify TailwindCSS is configured             |
| API calls fail        | Check backend running & VITE_API_URL correct |
| Role not recognized   | Log console: `console.log(user.role)`        |
