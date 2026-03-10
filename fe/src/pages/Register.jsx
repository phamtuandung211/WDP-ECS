import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Input, Button, Alert } from "./UI";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { register, googleLogin, loading } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");

    const errors = {};
    if (!email || !validateEmail(email)) errors.email = "Invalid email";
    if (!password || password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!fullName || fullName.trim().length < 2)
      errors.fullName = "Invalid full name";
    if (!phone || phone.trim().length < 8) errors.phone = "Invalid phone";
    if (gender && !["MALE", "FEMALE"].includes(gender))
      errors.gender = "Gender must be MALE or FEMALE";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const payload = {
        email,
        password,
        fullName,
        phone,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
      };
      const data = await register(payload);
      if (data?.otp) {
        setSuccessMessage(`Registration successful. OTP (dev): ${data.otp}`);
      }
      // Redirect to verify page to enter OTP
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors || {});
      }
      setGeneralError(resp?.message || "Registration failed");
    }
  };

  return (
    <div className="page register-page">
      <div className="form-container">
        <h2>Register</h2>
        {generalError && <Alert type="error">{generalError}</Alert>}
        {successMessage && <Alert type="success">{successMessage}</Alert>}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />

          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
            required
          />

          <Input
            label="Phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={fieldErrors.phone}
            required
          />

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {fieldErrors.gender && (
              <span className="form-error">{fieldErrors.gender}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Date of birth</label>
            <input
              className="form-input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
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
              await googleLogin(credentialResponse.credential);
              navigate("/");
            } catch (err) {
              setGeneralError(
                err.response?.data?.message || "Google registration failed",
              );
            }
          }}
          onError={() => setGeneralError("Google sign-up failed")}
          text="signup_with"
          width="100%"
        />

        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
