import React, { useEffect, useState } from "react";
import { appointmentService } from "../../services";
import {
  APPOINTMENT_STATUS,
  PAYMENT_TIMEOUT_MINUTES,
} from "../../constants/appointment";

/**
 * AppointmentPaymentCountdown Component
 * Shows countdown timer for payment deadline
 * Automatically refreshes appointment status
 * Optionally auto-cancels if payment expires
 */
export function AppointmentPaymentCountdown({
  appointment,
  onStatusChange,
  onExpire,
  showCountdown = true,
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (
      appointment.status !== APPOINTMENT_STATUS.PENDING_PAYMENT ||
      !appointment.paymentExpireAt
    ) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expireTime = new Date(appointment.paymentExpireAt);
      const diff = expireTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(null);

        // Trigger expiration callback
        if (onExpire) {
          onExpire(appointment);
        }

        // Auto-refresh to check backend status
        checkAppointmentStatus();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [appointment, onExpire]);

  const checkAppointmentStatus = async () => {
    try {
      const response = await appointmentService.getById(appointment._id);
      const updated = response.data?.data || response.data;

      if (updated.status !== appointment.status) {
        if (onStatusChange) {
          onStatusChange(updated);
        }
      }
    } catch (err) {
      console.error("Failed to check appointment status:", err);
    }
  };

  if (appointment.status !== APPOINTMENT_STATUS.PENDING_PAYMENT) {
    return null;
  }

  if (!showCountdown) {
    return null;
  }

  if (isExpired) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <div className="font-medium mb-1">⏰ Payment Deadline Passed</div>
        <p className="text-sm">
          Your payment was not completed within 15 minutes. This appointment
          will be automatically canceled.
        </p>
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const isUrgent = timeLeft.minutes < 5;

  return (
    <div
      className={`p-4 border rounded-lg ${
        isUrgent
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-yellow-50 border-yellow-200 text-yellow-800"
      }`}
    >
      <div className="font-medium mb-1">
        ⏱️ Payment Expires In: {timeLeft.minutes}:
        {timeLeft.seconds.toString().padStart(2, "0")}
      </div>
      <p className="text-sm">
        Please complete your payment before the deadline to confirm your
        appointment.
      </p>
    </div>
  );
}

/**
 * AppointmentStatusBadge Component
 * Displays appointment status with visual indicator
 */
export function AppointmentStatusBadge({ status, label }) {
  const statusStyles = {
    [APPOINTMENT_STATUS.PENDING_PAYMENT]: "bg-yellow-100 text-yellow-800",
    [APPOINTMENT_STATUS.WAITING_ASSIGN]: "bg-blue-100 text-blue-800",
    [APPOINTMENT_STATUS.CONFIRMED]: "bg-green-100 text-green-800",
    [APPOINTMENT_STATUS.COMPLETED]: "bg-gray-100 text-gray-800",
    [APPOINTMENT_STATUS.CANCELED]: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

/**
 * Hook for managing appointment status polling
 */
export function useAppointmentStatus(appointmentId, options = {}) {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    refreshInterval = 30000, // Refresh every 30 seconds
    autoRefresh = true,
    onStatusChange = null,
  } = options;

  const refreshStatus = async () => {
    if (!appointmentId) return;

    try {
      setLoading(true);
      const response = await appointmentService.getById(appointmentId);
      const updated = response.data?.data || response.data;

      if (updated.status !== appointment?.status && onStatusChange) {
        onStatusChange(updated);
      }

      setAppointment(updated);
      setError(null);
    } catch (err) {
      console.error("Failed to refresh appointment status:", err);
      setError(err.response?.data?.message || "Failed to refresh status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Set up auto-refresh interval
    if (!autoRefresh) return;

    const interval = setInterval(refreshStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [appointmentId, autoRefresh, refreshInterval]);

  return { appointment, loading, error, refresh: refreshStatus };
}

/**
 * Hook for monitoring payment expiration
 */
export function usePaymentExpiration(appointment, callback) {
  useEffect(() => {
    if (
      appointment?.status !== APPOINTMENT_STATUS.PENDING_PAYMENT ||
      !appointment?.paymentExpireAt
    ) {
      return;
    }

    const checkExpiration = () => {
      const now = new Date();
      const expireTime = new Date(appointment.paymentExpireAt);

      if (now >= expireTime) {
        if (callback) {
          callback(appointment);
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [appointment, callback]);
}
