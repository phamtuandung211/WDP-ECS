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
      <div className="max-w-md mx-auto mt-12 p-6 border rounded bg-white text-center">
        <h2 className="text-2xl font-bold mb-4">Verification Successful</h2>
        <p>Your email has been verified. You can now login.</p>
        <div className="mt-6">
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    </div>
  );
}
