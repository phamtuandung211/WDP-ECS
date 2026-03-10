import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Input, Button, Alert } from "../components/UI";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, googleLogin, loading, error } = useAuth();
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
      console.error("Login error:", err);
    }
  };

  return (
    <div className="page login-page">
      <div className="form-container">
        <h2>Login</h2>
        {error && <Alert type="error">{error}</Alert>}
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
          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div
          style={{ display: "flex", alignItems: "center", margin: "16px 0" }}
        >
          <hr style={{ flex: 1 }} />
          <span style={{ padding: "0 8px", color: "#888" }}>or</span>
          <hr style={{ flex: 1 }} />
        </div>

        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              const user = await googleLogin(credentialResponse.credential);
              if (user?.role === "SALE_STAFF") {
                navigate("/staff/dashboard");
              } else {
                navigate("/");
              }
            } catch (err) {
              console.error("Google login error:", err);
            }
          }}
          onError={() => console.error("Google Login Failed")}
          text="signin_with"
          width="100%"
        />

        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}
