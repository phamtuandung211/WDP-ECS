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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

    if (!acceptedTerms) {
      setError("Vui lòng đồng ý với điều khoản đặt lịch trước khi tiếp tục");
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
      <h3>Đặt lịch cơ bản</h3>
      <p className="text-sm text-gray-600 mb-4">
        Chọn ngày bạn muốn khám, sau đó hoàn tất thanh toán. Nhân viên sẽ xem
        xét và xác nhận lịch hẹn của bạn trong vòng 24 giờ. Bạn sẽ nhận được
        thông báo
      </p>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="desiredDate"
            className="block text-sm font-medium mb-1"
          >
            Ngày mong muốn <span className="text-red-500">*</span>
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
            Phải đặt lịch ít nhất 1 ngày trước {getBookingRules()}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {isWithinBusinessHours
              ? `✓ Hiện tại trong giờ làm việc (${BUSINESS_HOURS_START_HOUR}:${String(BUSINESS_HOURS_START_MINUTE).padStart(2, "0")} - ${BUSINESS_HOURS_END_HOUR}:${String(BUSINESS_HOURS_END_MINUTE).padStart(2, "0")})`
              : `⚠ Hiện tại ngoài giờ làm việc. Thời gian đặt lịch sớm nhất có thể đặt: ${new Date(minDate).toLocaleDateString("vi-VN")}`}
          </p>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium mb-1">
            Ghi chú thêm (tình trạng sức khỏe, yêu cầu đặc biệt, v.v.)
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Bạn có thể ghi chú các yêu cầu đặc biệt hoặc thông tin cần thiết cho bác sĩ... (tình trạng sức khỏe, yêu cầu đặc biệt, v.v.)"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !acceptedTerms}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Tạo lịch hẹn và thanh toán"}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-3">Điều khoản đặt lịch</h4>

        {/* Điều khoản đặt lịch */}
        <p className="text-sm font-semibold text-blue-900 mb-1">
          📌 Điều khoản đặt lịch
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside mb-3">
          <li>
            <strong>Trong giờ hành chính (7:30 - 17:30):</strong> Được đặt lịch
            từ ngày mai trở đi
          </li>
          <li>
            <strong>Ngoài giờ hành chính:</strong> Được đặt lịch từ ngày kia trở
            đi
          </li>
          <li>Thời gian đặt lịch tối đa: trước 7 ngày</li>
          <li>
            <strong>Lưu ý (gói cơ bản):</strong> Sau khi thanh toán, lịch hẹn
            chỉ được sắp xếp trong ngày (không chọn trước giờ cụ thể)
          </li>
        </ul>

        {/* Quy trình xử lý */}
        <p className="text-sm font-semibold text-blue-900 mb-1">
          🔄 Quy trình xử lý
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside mb-3">
          <li>
            Bạn sẽ được chuyển đến trang thanh toán (cần hoàn tất trong 15 phút)
          </li>
          <li>
            Nhân viên của chúng tôi sẽ xem xét và phân công bác sĩ cùng thời
            gian phù hợp
          </li>
          <li>Bạn sẽ nhận được thông báo khi lịch hẹn được xác nhận</li>
        </ul>

        {/* Chính sách & lưu ý */}
        <p className="text-sm font-semibold text-blue-900 mb-1">
          ⚠️ Chính sách & lưu ý
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Nếu không hoàn tất thanh toán trong 15 phút, lịch đặt sẽ tự động bị
            hủy
          </li>
          <li>
            Sau khi thanh toán, nếu muốn hủy lịch, vui lòng liên hệ hotline để
            được hỗ trợ
          </li>
          <li>
            Phí đã thanh toán có thể không được hoàn lại tùy theo thời điểm hủy
          </li>
          <li>
            Vui lòng đến đúng giờ, nếu đến trễ có thể phải chờ hoặc dời lịch
          </li>
        </ul>

        <label className="mt-4 flex items-start gap-2 text-sm text-blue-900">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (e.target.checked) {
                setError(null);
              }
            }}
            className="mt-0.5"
          />
          <span>
            Tôi đã đọc và đồng ý với{" "}
            <strong>các điều khoản và chính sách đặt lịch</strong>.
          </span>
        </label>
      </div>
    </div>
  );
}
