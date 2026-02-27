import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Button, Alert } from "./UI";

function getEmailFromLocation(location) {
  const params = new URLSearchParams(location.search);
  return params.get("email") || "";
}

export function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, loading } = useAuth();

  const [email, setEmail] = useState(getEmailFromLocation(location));
  const [otpCode, setOtpCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const e = getEmailFromLocation(location);
    if (e) setEmail(e);
  }, [location]);

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

  const handleVerify = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");

    const errors = {};
    if (!email || !validateEmail(email)) errors.email = "Invalid email";
    if (!otpCode || otpCode.toString().trim().length !== 6)
      errors.otpCode = "OTP code must be 6 digits";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await verifyOtp({ email, otpCode });
      // Redirect to success page
      navigate("/verify/success");
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) setFieldErrors(resp.errors || {});
      setGeneralError(resp?.message || "Verify failed");
    }
  };

  const handleResend = async () => {
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");
    if (!email) {
      setFieldErrors({ email: "Email is required to resend OTP" });
      return;
    }
    try {
      const data = await resendOtp({ email });
      if (data?.otp) {
        setSuccessMessage(`${data.message} OTP (dev): ${data.otp}`);
      } else {
        setSuccessMessage(data.message || "OTP resent successfully");
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) setFieldErrors(resp.errors || {});
      setGeneralError(resp?.message || "Resend failed");
    }
  };

  return (
    <div className="page verify-page">
      <div className="form-container">
        <h2>Verify Email</h2>
        {generalError && <Alert type="error">{generalError}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}
        <form onSubmit={handleVerify}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />

          <Input
            label="OTP code"
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            error={fieldErrors.otpCode}
            placeholder="6-digit code"
            required
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <Button type="button" onClick={handleResend} disabled={loading}>
              {loading ? "Processing..." : "Resend OTP"}
            </Button>
          </div>
        </form>
        <p>
          Want to go back? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
