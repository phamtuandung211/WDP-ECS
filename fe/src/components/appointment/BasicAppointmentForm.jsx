import React, { useState } from "react";
import { appointmentService } from "../../services";
import { APPOINTMENT_TYPE } from "../../constants/appointment";
import { Alert, Loading } from "../UI";

export function BasicAppointmentForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    type: APPOINTMENT_TYPE.BASIC,
    desiredDate: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Calculate min and max dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7); // Max 7 days advance

  const minDateString = today.toISOString().split("T")[0];
  const maxDateString = maxDate.toISOString().split("T")[0];

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

      setSuccess(
        "Appointment created! Please complete payment within 15 minutes.",
      );
      setFormData({
        type: APPOINTMENT_TYPE.BASIC,
        desiredDate: "",
        note: "",
      });

      // Notify parent component
      if (onSuccess) {
        setTimeout(() => onSuccess(response.data), 1000);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create appointment";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

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
            You can book up to 7 days in advance
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
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            You'll be redirected to payment (must complete within 15 minutes)
          </li>
          <li>Our staff will review and assign a doctor and time slot</li>
          <li>
            You'll receive a notification once your appointment is confirmed
          </li>
          <li>Status will change from "Waiting Assign" to "Confirmed"</li>
        </ul>
      </div>
    </div>
  );
}
