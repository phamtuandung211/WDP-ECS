import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // just redirect to login for static demo
    navigate("/login");
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded bg-white">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
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

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Gender</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {fieldErrors.gender && (
            <span className="text-red-600 text-sm">{fieldErrors.gender}</span>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Date of birth</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Address</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <Button type="submit">Register</Button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600">
          Login
        </a>
      </p>
    </div>
  );
}
