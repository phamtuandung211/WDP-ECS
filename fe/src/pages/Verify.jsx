import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Button, Alert } from "./UI";

function getEmailFromLocation(location) {
  const params = new URLSearchParams(location.search);
  return params.get("email") || "";
}

export function Verify() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(getEmailFromLocation(location));
  const [otpCode, setOtpCode] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleVerify = (e) => {
    e.preventDefault();
    navigate("/verify/success");
  };

  return (
    <div className="page verify-page">
      <div className="form-container">
        <h2>Verify Email</h2>
        {generalError && <Alert type="error">{generalError}</Alert>}
        <form onSubmit={handleVerify}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="OTP code"
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="6-digit code"
            required
          />

          <Button type="submit" className="mt-4">
            Verify
          </Button>
        </form>
        <p>
          Want to go back? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
