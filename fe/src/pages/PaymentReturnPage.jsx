import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { appointmentService } from "../services";
import { Loading, Alert } from "../components/UI";

/**
 * Payment Return Page
 * Handles both success (returnUrl/success) and cancel (cancelUrl/cancel) from PayOS
 *
 * Success URL: /payment/success?orderCode=xxx or /payment/return?orderCode=xxx
 * Cancel URL: /payment/cancel?orderCode=xxx
 */
export function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'not_found', 'expired', 'generic'

  const orderCode = searchParams.get("orderCode");
  const status = searchParams.get("status");
  const appointmentId = searchParams.get("appointmentId");

  // Determine if this is a success or cancel return
  const pathname = window.location.pathname;
  const isSuccess =
    pathname.includes("/payment/success") ||
    pathname.includes("/payment/return") ||
    status === "PAID";
  const isCancel = pathname.includes("/payment/cancel");

  useEffect(() => {
    handleReturn();
  }, []);

  const handleReturn = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);

      // Try to find appointment - first by appointmentId query param, then search in user's appointments
      let apt = null;

      try {
        if (appointmentId) {
          const response = await appointmentService.getById(appointmentId);
          apt = response.data?.data || response.data;
        } else {
          // Fallback: get all appointments and find the one with matching orderCode
          const allResponse = await appointmentService.getAll({ limit: 100 });
          const all = allResponse.data?.data || allResponse.data || [];
          apt = all.find(
            (a) => a.paymentOrderCode === orderCode || a._id === appointmentId,
          );
        }
      } catch (fetchErr) {
        // Appointment not found or deleted
        if (fetchErr.response?.status === 404) {
          setErrorType("not_found");
          setError(
            "Appointment not found or has been cancelled. This may happen if payment wasn't completed within 15 minutes.",
          );
        } else {
          throw fetchErr;
        }
      }

      if (apt) {
        setAppointment(apt);
      }

      // Small delay to ensure webhook processed
      if (isSuccess && apt?._id) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Refresh appointment to get latest status
        try {
          const freshResponse = await appointmentService.getById(apt._id);
          setAppointment(freshResponse.data?.data || freshResponse.data);
        } catch (refreshErr) {
          console.warn("Could not refresh appointment:", refreshErr);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Return page error:", err);
      setErrorType("generic");
      setError(err.response?.data?.message || "Failed to verify appointment");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">
            {isSuccess ? "Verifying payment..." : "Processing cancellation..."}
          </p>
        </div>
      </div>
    );
  }

  // Payment Successful
  if (isSuccess && appointment) {
    const isBasic = appointment.type === "BASIC";

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-5xl text-green-500 mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              {isBasic
                ? "Your appointment is created. Our staff will review and assign a doctor soon."
                : "Your appointment is confirmed and ready!"}
            </p>

            {appointment && (
              <div className="bg-gray-50 rounded p-4 mb-6 text-left">
                <div className="mb-3">
                  <label className="text-sm text-gray-600">
                    Appointment ID
                  </label>
                  <p className="font-semibold text-xs truncate">
                    {appointment._id}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="text-sm text-gray-600">Type</label>
                  <p className="font-semibold capitalize">{appointment.type}</p>
                </div>
                <div className="mb-3">
                  <label className="text-sm text-gray-600">Status</label>
                  <p className="font-semibold text-blue-600 capitalize">
                    {appointment.status?.replace(/_/g, " ")}
                  </p>
                </div>
                {appointment.appointmentDate && (
                  <div>
                    <label className="text-sm text-gray-600">
                      Appointment Date
                    </label>
                    <p className="font-semibold">
                      {new Date(
                        appointment.appointmentDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate("/appointments")}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                View My Appointments
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Appointment Not Found (Expired or Deleted)
  if (errorType === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-5xl text-orange-500 mb-4">⏱️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Appointment Expired
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-gray-500 text-sm mb-6">
              You have 15 minutes to complete payment. If you didn't complete
              payment in time, the appointment was automatically cancelled.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/appointments?tab=basic")}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              >
                Book New Appointment
              </button>
              <button
                onClick={() => navigate("/appointments")}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
              >
                Back to My Appointments
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Cancelled/Failed (User cancelled or generic error)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-5xl text-red-500 mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isCancel ? "Payment Cancelled" : "Payment Failed"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isCancel
              ? "You cancelled the payment. Your appointment has been cancelled."
              : "Your payment could not be processed. Please try again."}
          </p>

          {error && errorType !== "not_found" && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          <div className="space-y-3">
            {isCancel ? (
              <>
                <button
                  onClick={() => navigate("/appointments?tab=basic")}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Book New Appointment
                </button>
                <button
                  onClick={() => navigate("/appointments")}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
                >
                  View My Appointments
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    window.history.back();
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Retry Payment
                </button>
                <button
                  onClick={() => navigate("/appointments")}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
                >
                  Back to Appointments
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
