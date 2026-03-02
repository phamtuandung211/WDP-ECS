import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Button, Alert } from "../components/UI";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user?.role === "SALE_STAFF") {
        navigate("/staff/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      // login error already stored in context; optionally set local error
      setError(authError || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="page login-page">
      <div className="max-w-md mx-auto mt-12 p-6 border rounded bg-white">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {(error || authError) && (
          <Alert type="error">{error || authError}</Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit">Login</Button>
        </form>
        <p className="mt-4 text-sm">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
