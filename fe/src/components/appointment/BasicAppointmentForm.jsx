import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService } from "../../services";
import { APPOINTMENT_TYPE } from "../../constants/appointment";
import { Alert, Loading } from "../UI";

export function BasicAppointmentForm({ onSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: APPOINTMENT_TYPE.BASIC,
    desiredDate: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Business hours: 7:30 AM - 5:30 PM
  const BUSINESS_HOURS_START_HOUR = 7;
  const BUSINESS_HOURS_START_MINUTE = 30;
  const BUSINESS_HOURS_END_HOUR = 17;
  const BUSINESS_HOURS_END_MINUTE = 30;

  // Calculate min and max dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Convert to minutes for comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const businessStartInMinutes =
    BUSINESS_HOURS_START_HOUR * 60 + BUSINESS_HOURS_START_MINUTE;
  const businessEndInMinutes =
    BUSINESS_HOURS_END_HOUR * 60 + BUSINESS_HOURS_END_MINUTE;

  const isWithinBusinessHours =
    currentTimeInMinutes >= businessStartInMinutes &&
    currentTimeInMinutes < businessEndInMinutes;

  // Determine minimum booking date
  let minDate = new Date(today);
  if (isWithinBusinessHours) {
    // During business hours: can book from tomorrow
    minDate.setDate(minDate.getDate() + 1);
  } else {
    // After business hours: can only book from day after tomorrow
    minDate.setDate(minDate.getDate() + 2);
  }

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7); // Max 7 days advance

  // Format dates using local timezone (not UTC)
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const minDateString = formatDateString(minDate);
  const maxDateString = formatDateString(maxDate);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.desiredDate) {
      setError("Please select a date");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: APPOINTMENT_TYPE.BASIC,
        desiredDate: new Date(formData.desiredDate),
        note: formData.note || undefined,
      };

      const response = await appointmentService.create(payload);
      const appointment = response.data?.data || response.data;

      setSuccess("Appointment created! Redirecting to payment...");

      // Notify parent component
      if (onSuccess) {
        onSuccess(appointment);
      }

      // Redirect to payment page after 1 second
      setTimeout(() => {
        navigate(`/payment?appointmentId=${appointment._id}`);
      }, 1000);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create appointment";
      setError(message);
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const getBookingRules = () => {
    const endTimeStr = `${BUSINESS_HOURS_END_HOUR}:${String(BUSINESS_HOURS_END_MINUTE).padStart(2, "0")}`;

    if (isWithinBusinessHours) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString("vi-VN", {
        weekday: "short",
        month: "2-digit",
        day: "2-digit",
      });
      return `(Booking available until ${endTimeStr} today for ${tomorrowStr})`;
    } else {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dateStr = dayAfterTomorrow.toLocaleDateString("vi-VN", {
        weekday: "short",
        month: "2-digit",
        day: "2-digit",
      });
      return `(After business hours - earliest available: ${dateStr})`;
    }
  };

  return (
    <div className="basic-appointment-form">
      <h3>Book Basic Appointment</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose your preferred date. A doctor and time slot will be assigned by
        our staff.
      </p>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="desiredDate"
            className="block text-sm font-medium mb-1"
          >
            Preferred Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="desiredDate"
            name="desiredDate"
            value={formData.desiredDate}
            onChange={handleChange}
            min={minDateString}
            max={maxDateString}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Must book at least 1 day in advance {getBookingRules()}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {isWithinBusinessHours
              ? `✓ Currently within business hours (${BUSINESS_HOURS_START_HOUR}:${String(BUSINESS_HOURS_START_MINUTE).padStart(2, "0")} - ${BUSINESS_HOURS_END_HOUR}:${String(BUSINESS_HOURS_END_MINUTE).padStart(2, "0")})`
              : `⚠ Currently outside business hours. Earliest booking: ${new Date(minDate).toLocaleDateString("vi-VN")}`}
          </p>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Any special requirements or health concerns?"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create Appointment"}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Booking Rules</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <strong>During business hours (7:30 - 17:30):</strong> Book from
            tomorrow onwards
          </li>
          <li>
            <strong>After business hours:</strong> Book from day after tomorrow
            onwards
          </li>
          <li>Maximum booking window: 7 days in advance</li>
          <li>
            You'll be redirected to payment (must complete within 15 minutes)
          </li>
          <li>Our staff will review and assign a doctor and time slot</li>
          <li>
            You'll receive a notification once your appointment is confirmed
          </li>
        </ul>
      </div>
    </div>
  );
}
