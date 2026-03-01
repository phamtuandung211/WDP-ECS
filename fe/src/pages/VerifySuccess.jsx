import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./UI";

export function VerifySuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/login"), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="page verify-success-page">
      <div className="form-container">
        <h2>Verification Successful</h2>
        <p>Your email has been verified. You can now login.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    </div>
  );
}
