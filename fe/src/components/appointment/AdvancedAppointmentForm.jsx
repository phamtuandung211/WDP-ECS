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
  maxDate.setDate(maxDate.getDate() + 7);

  // Format dates using local timezone (not UTC)
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const minDateString = formatDateString(minDate);
  const maxDateString = formatDateString(maxDate);

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
      <h3>Đặt lịch nâng cao</h3>
      <p className="text-sm text-gray-600 mb-4">
        chọn bác sĩ, ngày giờ cụ thể và nhận ưu tiên đặt lịch (nếu có)
      </p>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Doctor Selection */}
        <div>
          <label htmlFor="doctorId" className="block text-sm font-medium mb-2">
            Chọn bác sĩ <span className="text-red-500">*</span>
          </label>
          <select
            id="doctorId"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled hidden>
              -- Vui lòng chọn bác sĩ --
            </option>
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
            Chọn ngày <span className="text-red-500">*</span>
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
              Vui lòng chọn bác sĩ trước khi chọn ngày
            </p>
          )}
        </div>

        {/* Slot Selection */}
        {formData.date && (
          <div>
            <label htmlFor="slotId" className="block text-sm font-medium mb-2">
              Chọn khung giờ <span className="text-red-500">*</span>
            </label>
            {slotsLoading ? (
              <p className="text-sm text-gray-500">
                Đang tải các khung giờ có sẵn...
              </p>
            ) : slots.length === 0 ? (
              <Alert type="warning">
                Không có khung giờ cho ngày{" "}
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
            Ghi chú thêm (tình trạng sức khỏe, yêu cầu đặc biệt, v.v.)
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Bạn có thể ghi chú các yêu cầu đặc biệt hoặc thông tin cần thiết cho bác sĩ..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary */}
        {selectedDoctor && selectedSlot && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">
              Nội dung lịch hẹn
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>
                <strong>Bác sĩ:</strong>{" "}
                {selectedDoctor.fullName || selectedDoctor.name}
              </li>
              <li>
                <strong>Ngày:</strong>{" "}
                {new Date(formData.date).toLocaleDateString()}
              </li>
              <li>
                <strong>Khung giờ:</strong> {formatSlotTime(selectedSlot)}
              </li>
              <li>
                <strong>Loại:</strong> Nâng cao (ưu tiên chọn chỗ sau khi thanh
                toán)
              </li>
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.doctorId || !formData.slotId}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Booking..." : "Đặt lịch ngay"}
        </button>
      </form>
    </div>
  );
}
