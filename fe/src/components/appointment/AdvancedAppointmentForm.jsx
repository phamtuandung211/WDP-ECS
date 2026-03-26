import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  const [currentTime, setCurrentTime] = useState(new Date());

  const ADVANCED_BOOKING_CUTOFF_MINUTES = 60;

  // Advanced appointments can be booked on the same day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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
        setError("Không thể tải danh sách bác sĩ");
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
        setError("Không thể tải các khung giờ trống");
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
      setError("Vui lòng chọn cả bác sĩ và khung giờ");
      return;
    }

    if (!selectedSlot || isSlotDisabledForSelection(selectedSlot)) {
      setError(
        "Khung giờ đã chọn không còn hợp lệ. Vui lòng chọn lại khung giờ khác.",
      );
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

      setSuccess("Đặt lịch thành công! Đang chuyển đến trang thanh toán...");

      if (onSuccess) {
        onSuccess(appointment);
      }

      // Redirect to payment page after 1 second
      setTimeout(() => {
        navigate(`/payment?appointmentId=${appointment._id}`);
      }, 1000);
    } catch (err) {
      const message = err.response?.data?.message || "Không thể tạo lịch hẹn";
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

  const isSlotBeforeCutoff = (slot) => {
    const slotStartTime = new Date(slot.startTime);
    const cutoffTime = new Date(
      currentTime.getTime() + ADVANCED_BOOKING_CUTOFF_MINUTES * 60 * 1000,
    );

    return slotStartTime < cutoffTime;
  };

  const isSlotDisabledForSelection = (slot) => {
    const remaining = slot.maxPatients - slot.bookedCount;
    const isFull = remaining <= 0;
    const isDisabledForAdvanced = slot.bookedCount >= 1;
    const isDisabledByCutoff = isSlotBeforeCutoff(slot);

    return isFull || isDisabledForAdvanced || isDisabledByCutoff;
  };

  const hasSelectableSlots = slots.some(
    (slot) => !isSlotDisabledForSelection(slot),
  );

  const getSlotMeta = (slot) => {
    const remaining = slot.maxPatients - slot.bookedCount;
    const isFull = remaining <= 0;
    const isDisabledForAdvanced = slot.bookedCount >= 1;
    const isDisabledByCutoff = isSlotBeforeCutoff(slot);
    const isDisabled = isFull || isDisabledForAdvanced || isDisabledByCutoff;

    let statusClass = "text-green-600";
    // Show remaining slots or specific reason if disabled
    let statusText = `Còn ${remaining} chỗ`;

    if (isFull) {
      statusClass = "text-red-500";
      statusText = "Đã đầy";
    } else if (isDisabledForAdvanced) {
      statusClass = "text-amber-600";
      statusText = `Còn ${remaining} chỗ (không khả dụng cho gói nâng cao)`;
    } else if (isDisabledByCutoff) {
      statusClass = "text-amber-600";
      statusText = "Không khả dụng: còn dưới 60 phút so với hiện tại";
    }

    let containerClass = "border-gray-300 hover:border-blue-400";
    if (formData.slotId === slot._id) {
      containerClass = "border-blue-500 bg-blue-50";
    } else if (isDisabled) {
      containerClass =
        "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed";
    }

    return {
      isDisabled,
      statusClass,
      statusText,
      containerClass,
    };
  };

  let slotSelectionContent = null;
  if (slotsLoading) {
    slotSelectionContent = (
      <p className="text-sm text-gray-500">Đang tải các khung giờ có sẵn...</p>
    );
  } else if (slots.length === 0) {
    slotSelectionContent = (
      <Alert type="warning">
        Không có khung giờ cho ngày{" "}
        {selectedDoctor?.fullName || selectedDoctor?.name} vào ngày{" "}
        {new Date(formData.date).toLocaleDateString()}
      </Alert>
    );
  } else {
    slotSelectionContent = (
      <>
        {!hasSelectableSlots && (
          <Alert type="warning">
            Không còn khung giờ hợp lệ trong ngày này. Vui lòng chọn ngày khác
            hoặc khung giờ cách hiện tại ít nhất 60 phút.
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-2">
          {slots.map((slot) => {
            const { isDisabled, statusClass, statusText, containerClass } =
              getSlotMeta(slot);

            return (
              <label
                key={slot._id}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition ${containerClass}`}
              >
                <span className="sr-only">
                  Chọn khung giờ {formatSlotTime(slot)}
                </span>
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
                  <div className={`text-xs ${statusClass}`}>{statusText}</div>
                </div>
              </label>
            );
          })}
        </div>
      </>
    );
  }

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
                {doctor.specializations?.length || 0} chuyên khoa)
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
            {slotSelectionContent}
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
          {loading ? "Đang đặt lịch..." : "Đặt lịch ngay"}
        </button>
      </form>
    </div>
  );
}

AdvancedAppointmentForm.propTypes = {
  onSuccess: PropTypes.func,
};
