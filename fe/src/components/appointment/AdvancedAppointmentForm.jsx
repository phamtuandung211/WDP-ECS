import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentService, slotService, doctorService } from "../../services";
import { APPOINTMENT_TYPE } from "../../constants/appointment";
import { Alert, Loading } from "../UI";

export function AdvancedAppointmentForm({ onSuccess }) {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    type: APPOINTMENT_TYPE.ADVANCED,
    doctorId: "",
    slotId: "",
    date: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Calculate min and max dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);

  const minDateString = today.toISOString().split("T")[0];
  const maxDateString = maxDate.toISOString().split("T")[0];

  // Load doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await doctorService.getAllDoctor({
          limit: 100,
        });
        setDoctors(response.data?.data || response.data || []);
      } catch (err) {
        setError("Failed to load doctors");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Load slots when doctor and date are selected
  useEffect(() => {
    if (!formData.doctorId || !formData.date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        setError(null);
        const response = await slotService.getAvailable({
          date: formData.date,
          doctorId: formData.doctorId,
          type: APPOINTMENT_TYPE.ADVANCED,
        });
        setSlots(response.data?.data || response.data || []);
      } catch (err) {
        setError("Failed to load available slots");
        console.error(err);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [formData.doctorId, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset slot selection if date/doctor changes
      ...(name === "date" || name === "doctorId" ? { slotId: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.doctorId || !formData.slotId) {
      setError("Please select both doctor and time slot");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: APPOINTMENT_TYPE.ADVANCED,
        doctorId: formData.doctorId,
        slotId: formData.slotId,
        note: formData.note || undefined,
      };

      const response = await appointmentService.create(payload);
      const appointment = response.data?.data || response.data;

      setSuccess("Appointment created! Redirecting to payment...");

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

  const selectedDoctor = doctors.find((d) => d._id === formData.doctorId);
  const selectedSlot = slots.find((s) => s._id === formData.slotId);

  const formatSlotTime = (slot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    return `${start.getHours().toString().padStart(2, "0")}:${start
      .getMinutes()
      .toString()
      .padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const getSlotAvailability = (slot) => {
    const remaining = slot.maxPatients - slot.bookedCount;
    if (remaining <= 0) return "FULL";
    return `${remaining} spots available`;
  };

  if (loading && doctors.length === 0) return <Loading />;

  return (
    <div className="advanced-appointment-form">
      <h3>Book Advanced Appointment</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose your preferred doctor and available time slot directly.
      </p>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Doctor Selection */}
        <div>
          <label htmlFor="doctorId" className="block text-sm font-medium mb-2">
            Select Doctor <span className="text-red-500">*</span>
          </label>
          <select
            id="doctorId"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Choose a doctor --</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.fullName || doctor.name} (
                {doctor.specializations?.length || 0} specializations)
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-2">
            Select Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={minDateString}
            max={maxDateString}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!formData.doctorId}
          />
          {!formData.doctorId && (
            <p className="text-xs text-gray-500 mt-1">
              Please select a doctor first
            </p>
          )}
        </div>

        {/* Slot Selection */}
        {formData.date && (
          <div>
            <label htmlFor="slotId" className="block text-sm font-medium mb-2">
              Select Time Slot <span className="text-red-500">*</span>
            </label>
            {slotsLoading ? (
              <p className="text-sm text-gray-500">
                Loading available slots...
              </p>
            ) : slots.length === 0 ? (
              <Alert type="warning">
                No available slots for{" "}
                {selectedDoctor?.fullName || selectedDoctor?.name} on{" "}
                {new Date(formData.date).toLocaleDateString()}
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const remaining = slot.maxPatients - slot.bookedCount;
                  const isFull = remaining <= 0;
                  // ADVANCED: Chỉ có thể book khi slot hoàn toàn trống (bookedCount = 0)
                  const isDisabledForAdvanced = slot.bookedCount >= 1;
                  const isDisabled = isFull || isDisabledForAdvanced;

                  return (
                    <label
                      key={slot._id}
                      className={`flex items-center p-3 border rounded-md cursor-pointer transition ${
                        formData.slotId === slot._id
                          ? "border-blue-500 bg-blue-50"
                          : isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="slotId"
                        value={slot._id}
                        checked={formData.slotId === slot._id}
                        onChange={handleChange}
                        disabled={isDisabled}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {formatSlotTime(slot)}
                        </div>
                        <div
                          className={`text-xs ${
                            isFull
                              ? "text-red-500"
                              : isDisabledForAdvanced
                                ? "text-amber-600"
                                : "text-green-600"
                          }`}
                        >
                          {isFull
                            ? "FULL"
                            : isDisabledForAdvanced
                              ? `${remaining} spots (unavailable for Advanced)`
                              : `${remaining} spots`}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
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

        {/* Summary */}
        {selectedDoctor && selectedSlot && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">Booking Summary</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>
                <strong>Doctor:</strong>{" "}
                {selectedDoctor.fullName || selectedDoctor.name}
              </li>
              <li>
                <strong>Date:</strong>{" "}
                {new Date(formData.date).toLocaleDateString()}
              </li>
              <li>
                <strong>Time:</strong> {formatSlotTime(selectedSlot)}
              </li>
              <li>
                <strong>Type:</strong> Advanced Appointment
              </li>
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.doctorId || !formData.slotId}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}
