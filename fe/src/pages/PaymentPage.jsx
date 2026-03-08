import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentService } from "../services";
import { Loading, Alert } from "../components/UI";

const MAX_RETRIES = 3;

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [redirecting, setRedirecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const appointmentId = searchParams.get("appointmentId");

  useEffect(() => {
    if (!appointmentId) {
      setError("Missing appointment ID");
      setLoading(false);
      return;
    }

    startPayment();
  }, [appointmentId]);

  // Countdown to redirect
  useEffect(() => {
    if (redirecting && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (redirecting && countdown === 0 && payment?.checkoutUrl) {
      globalThis.location.href = payment.checkoutUrl;
    }
  }, [redirecting, countdown, payment]);

  const startPayment = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get payment link from backend
      const response = await paymentService.createPaymentLink(appointmentId);
      const paymentData = response.data?.data;

      if (!paymentData?.checkoutUrl) {
        throw new Error("No checkout URL from PayOS");
      }

      setPayment(paymentData);
      setRetryCount(0);
      setIsRetrying(false);
      setLoading(false);

      // Start countdown after 1 second to let user read
      setTimeout(() => setRedirecting(true), 1000);
    } catch (err) {
      console.error("Payment error:", err);

      const errorMsg =
        err.response?.data?.message || "Failed to create payment link";
      const isWriteConflict =
        errorMsg.includes("Write conflict") ||
        err.message?.includes("conflict");

      if (isWriteConflict && retryCount < MAX_RETRIES) {
        // Auto-retry with exponential backoff (1s, 2s, 4s)
        const backoffMs = Math.pow(2, retryCount) * 1000;
        setRetryCount(retryCount + 1);
        setError(
          `Retrying connection (attempt ${retryCount + 1}/${MAX_RETRIES})...`,
        );

        setTimeout(() => {
          startPayment(true);
        }, backoffMs);
      } else {
        setError(errorMsg);
        setLoading(false);
        setIsRetrying(false);
      }
    }
  };

  if (loading || isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600 font-medium">
            {isRetrying
              ? `Retrying payment setup (${retryCount}/${MAX_RETRIES})...`
              : "Creating payment link..."}
          </p>
          {isRetrying && (
            <p className="mt-2 text-sm text-gray-500">
              This may take a moment, please wait.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && !isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error">{error}</Alert>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate("/appointments")}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
            >
              Back to Appointments
            </button>
            <button
              onClick={() => {
                setRetryCount(0);
                startPayment();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Retry Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (payment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center">
            <div className="text-5xl text-blue-600 mb-4">💳</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Ready to Pay
            </h1>
            <p className="text-gray-600 mb-6">
              You'll be redirected to PayOS to complete your payment
            </p>

            {/* Payment Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 text-left border border-blue-100">
              <div className="mb-3">
                <div className="text-sm text-gray-600">Amount</div>
                <p className="font-bold text-lg text-blue-600">
                  {payment.amount?.toLocaleString()} VND
                </p>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <p className="font-semibold text-green-600">Pending Payment</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-yellow-800 mb-2">
                ⏱️ Payment Deadline
              </div>
              <p className="text-xs text-yellow-700">
                You have <span className="font-bold">15 minutes</span> to
                complete payment. If not completed, your appointment will be
                automatically cancelled.
              </p>
            </div>

            {/* Redirect Countdown */}
            {redirecting ? (
              <div className="mb-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
                <p className="text-sm text-blue-800">
                  Redirecting in{" "}
                  <span className="font-bold text-lg">{countdown}</span>{" "}
                  seconds...
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-green-100 rounded-lg border border-green-300">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Payment link ready
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!redirecting) {
                    setRedirecting(true);
                  }
                }}
                disabled={redirecting}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {redirecting ? `Redirecting (${countdown}s)...` : "Pay Now"}
              </button>
              <button
                onClick={() => navigate("/appointments")}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel & Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
