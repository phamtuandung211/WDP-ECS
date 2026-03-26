import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appointmentService, feedbackService } from "../services";
import { Loading, Alert } from "../components/UI";
import { BasicAppointmentForm } from "../components/appointment/BasicAppointmentForm";
import { AdvancedAppointmentForm } from "../components/appointment/AdvancedAppointmentForm";
import { AppointmentPaymentCountdown } from "../components/appointment/AppointmentTracking";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  BUSINESS_HOURS_END_HOUR,
  BUSINESS_HOURS_END_MINUTE,
  BUSINESS_HOURS_START_HOUR,
  BUSINESS_HOURS_START_MINUTE,
  SLOT_STEP_MINUTES,
  STATUS_LABELS,
} from "../constants/appointment";
import { useAppointmentNotificationRefresh } from "../context/AppointmentNotificationContext";

function buildSlots() {
  const slots = [];
  const startTotal =
    BUSINESS_HOURS_START_HOUR * 60 + BUSINESS_HOURS_START_MINUTE;
  const endTotal = BUSINESS_HOURS_END_HOUR * 60 + BUSINESS_HOURS_END_MINUTE;

  for (let t = startTotal; t < endTotal; t += SLOT_STEP_MINUTES) {
    const hour = Math.floor(t / 60);
    const minute = t % 60;
    slots.push(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  }

  return slots;
}

const SLOTS = buildSlots();

function toDateKey(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function getWeekDates(anchor) {
  const d = new Date(anchor);
  const dow = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function getAppointmentDateValue(appointment) {
  return appointment.desiredDate || appointment.slotId?.startTime || null;
}

function getAppointmentStartTime(appointment) {
  const slotStart = appointment.slotId?.startTime;
  if (!slotStart) return null;
  const d = new Date(slotStart);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getAppointmentEndTime(appointment) {
  const slotEnd = appointment.slotId?.endTime;
  if (!slotEnd) return null;
  const d = new Date(slotEnd);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getCalendarColor(appointment, existingFeedback) {
  if (
    appointment.status === APPOINTMENT_STATUS.COMPLETED &&
    !existingFeedback
  ) {
    return {
      bg: "var(--apt-color-pending-review)",
      bd: "var(--apt-color-pending-review-bd)",
      txt: "var(--apt-color-pending-review-txt)",
    };
  }
  if (appointment.status === APPOINTMENT_STATUS.COMPLETED && existingFeedback) {
    return {
      bg: "var(--apt-color-completed)",
      bd: "var(--apt-color-completed-bd)",
      txt: "var(--apt-color-completed-txt)",
    };
  }
  if (appointment.status === APPOINTMENT_STATUS.WAITING_ASSIGN) {
    return {
      bg: "var(--apt-color-waiting-assign)",
      bd: "var(--apt-color-waiting-assign-bd)",
      txt: "var(--apt-color-waiting-assign-txt)",
    };
  }
  if (appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT) {
    return {
      bg: "var(--apt-color-waiting-pay)",
      bd: "var(--apt-color-waiting-pay-bd)",
      txt: "var(--apt-color-waiting-pay-txt)",
    };
  }
  if (appointment.status === APPOINTMENT_STATUS.CANCELED) {
    return {
      bg: "var(--apt-color-canceled)",
      bd: "var(--apt-color-canceled-bd)",
      txt: "var(--apt-color-canceled-txt)",
    };
  }

  if (appointment.status === APPOINTMENT_STATUS.CONFIRMED) {
    return {
      bg: "var(--apt-color-basic)",
      bd: "var(--apt-color-basic-bd)",
      txt: "var(--apt-color-basic-txt)",
    };
  }

  return {
    bg: "var(--apt-color-basic)",
    bd: "var(--apt-color-basic-bd)",
    txt: "var(--apt-color-basic-txt)",
  };
}

function getStatusBadgeStyle(status, hasReview) {
  if (status === APPOINTMENT_STATUS.COMPLETED && !hasReview) {
    return { background: "#FAEEDA", color: "#633806" };
  }
  if (status === APPOINTMENT_STATUS.COMPLETED && hasReview) {
    return { background: "#D3D1C7", color: "#444441" };
  }

  switch (status) {
    case APPOINTMENT_STATUS.CONFIRMED:
      return { background: "#B5D4F4", color: "#0C447C" };
    case APPOINTMENT_STATUS.WAITING_ASSIGN:
      return { background: "#F4C0D1", color: "#72243E" };
    case APPOINTMENT_STATUS.PENDING_PAYMENT:
      return { background: "#FAC775", color: "#633806" };
    case APPOINTMENT_STATUS.CANCELED:
      return { background: "#b91c1c", color: "#e5e7eb" };
    default:
      return { background: "#eee", color: "#333" };
  }
}

export function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [filterStatus, setFilterStatus] = useState("all");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [payingAppointmentId, setPayingAppointmentId] = useState(null);
  const [expiredAppointmentIds, setExpiredAppointmentIds] = useState({});
  const detailPanelRef = useRef(null);

  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);
  const todayKey = toDateKey(new Date());

  const appointmentMap = useMemo(() => {
    const map = {};
    appointments.forEach((apt) => {
      map[apt._id] = apt;
    });
    return map;
  }, [appointments]);

  const selectedAppointment = selectedAppointmentId
    ? appointmentMap[selectedAppointmentId]
    : null;

  const selectedFeedback = selectedAppointment
    ? feedbackMap[selectedAppointment._id?.toString()]
    : null;

  const preselectAppointmentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("appointmentId");
  }, [location.search]);

  const calendarData = useMemo(() => {
    const bySlot = {};
    const noTime = {};

    appointments.forEach((apt) => {
      const day = toDateKey(getAppointmentDateValue(apt));
      if (!day) return;

      const start = getAppointmentStartTime(apt);
      if (start) {
        const key = `${day}__${start}`;
        if (!bySlot[key]) bySlot[key] = [];
        bySlot[key].push(apt);
      } else {
        if (!noTime[day]) noTime[day] = [];
        noTime[day].push(apt);
      }
    });

    return { bySlot, noTime };
  }, [appointments]);

  const refreshAppointments = async () => {
    const params = {};
    if (filterStatus !== "all") params.status = filterStatus;

    const response = await appointmentService.getAll(params);
    const apts = response.data?.data || response.data || [];
    setAppointments(apts);
    return apts;
  };

  const refreshFeedbacks = async () => {
    try {
      const res = await feedbackService.getMy({ limit: 100 });
      const feedbacks = res.data?.data || [];
      // Build map: appointmentId (string) → feedback object
      const map = {};
      feedbacks.forEach((fb) => {
        const aptId =
          typeof fb.appointmentId === "object"
            ? fb.appointmentId?._id
            : fb.appointmentId;
        if (aptId) map[aptId.toString()] = fb;
      });
      setFeedbackMap(map);
    } catch {
      // không ảnh hưởng UX nếu lỗi
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        await refreshAppointments();
        await refreshFeedbacks();
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, filterStatus]);

  useAppointmentNotificationRefresh({
    onAssigned: () =>
      user &&
      refreshAppointments().catch((err) =>
        console.warn("Refresh failed:", err),
      ),
  });

  const handleBookingSuccess = (newAppointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    setActiveTab("list");
    setSelectedAppointmentId(newAppointment?._id || null);
  };

  const handleCancel = async (appointmentId) => {
    if (
      !globalThis.confirm("Are you sure you want to cancel this appointment?")
    ) {
      return;
    }
    try {
      await appointmentService.cancel(appointmentId);
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId
            ? { ...apt, status: APPOINTMENT_STATUS.CANCELED }
            : apt,
        ),
      );
      alert("Appointment canceled successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handlePaymentExpired = (expiredAppointment) => {
    setExpiredAppointmentIds((prev) => ({
      ...prev,
      [expiredAppointment._id]: true,
    }));
    setAppointments((prev) =>
      prev.filter((apt) => apt._id !== expiredAppointment._id),
    );
    setSelectedAppointmentId((prev) =>
      prev === expiredAppointment._id ? null : prev,
    );
  };

  const handlePayNow = async (appointmentId) => {
    setPayingAppointmentId(appointmentId);
    try {
      navigate(`/payment?appointmentId=${appointmentId}`);
    } finally {
      setPayingAppointmentId(null);
    }
  };

  const changeWeek = (direction) => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + direction * 7);
    setAnchorDate(next);
    setSelectedAppointmentId(null);
  };

  useEffect(() => {
    if (
      selectedAppointmentId &&
      !appointments.some((apt) => apt._id === selectedAppointmentId)
    ) {
      setSelectedAppointmentId(null);
    }
  }, [appointments, selectedAppointmentId]);

  useEffect(() => {
    if (!preselectAppointmentId || !appointments.length) return;

    const matchedAppointment = appointments.find(
      (apt) => apt._id?.toString() === preselectAppointmentId,
    );

    if (!matchedAppointment) return;

    setActiveTab("list");
    setSelectedAppointmentId(matchedAppointment._id);

    const matchedDate = getAppointmentDateValue(matchedAppointment);
    if (matchedDate) {
      setAnchorDate(new Date(matchedDate));
    }
  }, [preselectAppointmentId, appointments]);

  useEffect(() => {
    if (!selectedAppointment || loading || activeTab !== "list") return;

    let rafId = null;
    const timer = globalThis.setTimeout(() => {
      const panelEl = detailPanelRef.current;
      if (!panelEl) return;

      const startY = globalThis.scrollY;
      const targetY =
        panelEl.getBoundingClientRect().top + globalThis.scrollY - 12;
      const distance = targetY - startY;
      const duration = 900;
      const startTime = performance.now();

      const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        globalThis.scrollTo(0, startY + distance * eased);

        if (progress < 1) {
          rafId = globalThis.requestAnimationFrame(step);
        }
      };

      rafId = globalThis.requestAnimationFrame(step);
    }, 120);

    return () => {
      globalThis.clearTimeout(timer);
      if (rafId) globalThis.cancelAnimationFrame(rafId);
    };
  }, [selectedAppointment, loading, activeTab]);

  if (!user) {
    return (
      <Alert type="warning">
        Please log in to view and manage appointments
      </Alert>
    );
  }

  if (loading && activeTab === "list") return <Loading />;

  return (
    <div className="page appointments-page max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Appointments</h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "list"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          My Appointments
        </button>
        <button
          onClick={() => setActiveTab("basic")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "basic"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Book Basic
        </button>
        <button
          onClick={() => setActiveTab("advanced")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "advanced"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Book Advanced
        </button>
      </div>

      {/* My Appointments Tab */}
      {activeTab === "list" && (
        <div className="appointments-list-section">
          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div>
              <label
                htmlFor="appointment-status-filter"
                className="block text-sm font-medium mb-1"
              >
                Filter by Status
              </label>
              <select
                id="appointment-status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                {Object.entries(APPOINTMENT_STATUS).map(([, value]) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            {/* <div>
              <label
                htmlFor="appointment-type-filter"
                className="block text-sm font-medium mb-1"
              >
                Filter by Type
              </label>
              <select
                id="appointment-type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value={APPOINTMENT_TYPE.BASIC}>Basic</option>
                <option value={APPOINTMENT_TYPE.ADVANCED}>Advanced</option>
              </select>
            </div> */}
          </div>

          {error && <Alert type="error">{error}</Alert>}

          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You haven't booked any appointments yet.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setActiveTab("basic")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Book Basic Appointment
                </button>
                <button
                  onClick={() => setActiveTab("advanced")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Book Advanced Appointment
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="apt-calendar__top-bar">
                <h3 className="apt-calendar__week-label">
                  {weekDates[0].toLocaleDateString("vi-VN")} -{" "}
                  {weekDates.at(-1)?.toLocaleDateString("vi-VN")}
                </h3>
                <div className="apt-calendar__nav-btns">
                  <button type="button" onClick={() => changeWeek(-1)}>
                    ← Tuần trước
                  </button>
                  <button type="button" onClick={() => changeWeek(1)}>
                    Tuần sau →
                  </button>
                </div>
              </div>

              <div className="apt-calendar__wrapper">
                <div
                  className="apt-calendar__grid"
                  style={{
                    gridTemplateColumns: `56px repeat(${weekDates.length}, 1fr)`,
                  }}
                >
                  <div className="apt-calendar__col-header">Giờ</div>
                  {weekDates.map((day) => {
                    const key = toDateKey(day);
                    return (
                      <div
                        key={key}
                        className={`apt-calendar__col-header ${
                          key === todayKey ? "is-today" : ""
                        }`}
                      >
                        {formatDayLabel(day)}
                      </div>
                    );
                  })}

                  {SLOTS.map((slotTime) => (
                    <React.Fragment key={slotTime}>
                      <div className="apt-calendar__time-label">{slotTime}</div>
                      {weekDates.map((day) => {
                        const key = `${toDateKey(day)}__${slotTime}`;
                        const slotAppointments = calendarData.bySlot[key] || [];
                        return (
                          <div key={key} className="apt-calendar__slot-cell">
                            {slotAppointments.map((apt) => {
                              const existing = feedbackMap[apt._id?.toString()];
                              const c = getCalendarColor(apt, existing);
                              const doctorLastName = apt.doctorId?.fullName
                                ? apt.doctorId.fullName.trim().split(" ").pop()
                                : "";

                              return (
                                <button
                                  type="button"
                                  key={apt._id}
                                  onClick={() =>
                                    setSelectedAppointmentId(apt._id)
                                  }
                                  className="apt-calendar__block"
                                  style={{
                                    background: c.bg,
                                    borderColor: c.bd,
                                    color: c.txt,
                                  }}
                                >
                                  <div className="apt-calendar__block-type">
                                    {apt.type === APPOINTMENT_TYPE.BASIC
                                      ? "Basic"
                                      : "Advanced"}
                                  </div>
                                  <div className="apt-calendar__block-doctor">
                                    {doctorLastName || "Assigned"}
                                  </div>

                                  {apt.status ===
                                    APPOINTMENT_STATUS.COMPLETED &&
                                    existing && (
                                      <div className="apt-calendar__block-review">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <span key={s}>
                                            {s <= existing.point ? "★" : "☆"}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                  {apt.status ===
                                    APPOINTMENT_STATUS.COMPLETED &&
                                    !existing && (
                                      <div className="apt-calendar__block-review-pending">
                                        ✍ Đánh giá ngay
                                      </div>
                                    )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}

                  {weekDates.some(
                    (day) => calendarData.noTime[toDateKey(day)]?.length,
                  ) && (
                    <>
                      <div className="apt-calendar__no-time-label">
                        Chưa có giờ
                      </div>
                      {weekDates.map((day) => {
                        const dayKey = toDateKey(day);
                        const noTimeAppointments =
                          calendarData.noTime[dayKey] || [];
                        return (
                          <div
                            key={`${dayKey}__no-time`}
                            className="apt-calendar__no-time-cell"
                          >
                            {noTimeAppointments.map((apt) => {
                              const existing = feedbackMap[apt._id?.toString()];
                              const c = getCalendarColor(apt, existing);
                              return (
                                <button
                                  type="button"
                                  key={apt._id}
                                  onClick={() =>
                                    setSelectedAppointmentId(apt._id)
                                  }
                                  className="apt-calendar__block"
                                  style={{
                                    background: c.bg,
                                    borderColor: c.bd,
                                    color: c.txt,
                                  }}
                                >
                                  <div className="apt-calendar__block-type">
                                    {apt.type === APPOINTMENT_TYPE.BASIC
                                      ? "Basic"
                                      : "Advanced"}
                                  </div>
                                  <div className="apt-calendar__block-id">
                                    #{apt._id?.slice(0, 6)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              <div className="apt-calendar__legend">
                <div className="apt-calendar__legend-item">
                  <span className="apt-calendar__legend-dot is-confirmed" />{" "}
                  Confirmed
                </div>
                <div className="apt-calendar__legend-item">
                  <span className="apt-calendar__legend-dot is-waiting-pay" />{" "}
                  Waiting for Payment
                </div>
                <div className="apt-calendar__legend-item">
                  <span className="apt-calendar__legend-dot is-waiting-assign" />{" "}
                  Waiting for Assignment
                </div>
                <div className="apt-calendar__legend-item">
                  <span className="apt-calendar__legend-dot is-canceled" />{" "}
                  Cancel
                </div>
                <div className="apt-calendar__legend-item">
                  <span className="apt-calendar__legend-dot is-pending-review" />{" "}
                  Completed - Chờ đánh giá
                </div>
                <div className="apt-calendar__legend-item">
                  <span className="apt-calendar__legend-dot is-completed" />{" "}
                  Completed - Đã đánh giá
                </div>
              </div>

              {selectedAppointment && (
                <div ref={detailPanelRef}>
                  <AppointmentDetailPanel
                    appointment={selectedAppointment}
                    existingFeedback={selectedFeedback}
                    isPayLoading={
                      payingAppointmentId === selectedAppointment._id
                    }
                    isExpired={Boolean(
                      expiredAppointmentIds[selectedAppointment._id],
                    )}
                    onClose={() => setSelectedAppointmentId(null)}
                    onCancel={() => handleCancel(selectedAppointment._id)}
                    onPayNow={() => handlePayNow(selectedAppointment._id)}
                    onGoFeedback={() =>
                      navigate(
                        `/feedback?appointmentId=${selectedAppointment._id}`,
                      )
                    }
                    onPaymentExpired={handlePaymentExpired}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Basic Booking Tab */}
      {activeTab === "basic" && (
        <div className="booking-form-section max-w-2xl">
          <BasicAppointmentForm onSuccess={handleBookingSuccess} />
        </div>
      )}

      {/* Advanced Booking Tab */}
      {activeTab === "advanced" && (
        <div className="booking-form-section max-w-2xl">
          <AdvancedAppointmentForm onSuccess={handleBookingSuccess} />
        </div>
      )}
    </div>
  );
}

function AppointmentDetailPanel({
  appointment,
  existingFeedback,
  isPayLoading,
  isExpired,
  onClose,
  onCancel,
  onPayNow,
  onGoFeedback,
  onPaymentExpired,
}) {
  let statusLabel = STATUS_LABELS[appointment.status] || appointment.status;
  if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    statusLabel = existingFeedback
      ? "Completed · Đã đánh giá"
      : "Completed · Chờ đánh giá";
  }

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return "TBD";
    return `${startTime} - ${endTime}`;
  };

  const canCancel = appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT;
  const isCompleted = appointment.status === APPOINTMENT_STATUS.COMPLETED;
  const hasReview = Boolean(existingFeedback);
  const startTime = getAppointmentStartTime(appointment);
  const endTime = getAppointmentEndTime(appointment);
  const dateValue = getAppointmentDateValue(appointment);
  const badgeStyle = getStatusBadgeStyle(appointment.status, hasReview);

  return (
    <div className="apt-calendar__detail-panel show">
      <div className="apt-calendar__detail-header">
        <div>
          <h3 className="font-semibold text-lg">Chi tiết lịch hẹn</h3>
          <p className="text-sm text-gray-500">{appointment._id}</p>
        </div>
        <button
          type="button"
          className="apt-calendar__detail-close"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="apt-calendar__detail-row">
        <span className="apt-calendar__detail-label">Loại</span>
        <span className="apt-calendar__detail-value">
          {appointment.type === APPOINTMENT_TYPE.BASIC ? "Basic" : "Advanced"}
        </span>
      </div>

      <div className="apt-calendar__detail-row">
        <span className="apt-calendar__detail-label">Trạng thái</span>
        <span className="apt-calendar__badge" style={badgeStyle}>
          {statusLabel}
        </span>
      </div>

      <div className="apt-calendar__detail-row">
        <span className="apt-calendar__detail-label">Ngày</span>
        <span className="apt-calendar__detail-value">
          {formatDate(dateValue)}
        </span>
      </div>

      {startTime && endTime && (
        <div className="apt-calendar__detail-row">
          <span className="apt-calendar__detail-label">Giờ</span>
          <span className="apt-calendar__detail-value">
            {formatTime(startTime, endTime)}
          </span>
        </div>
      )}

      <div className="apt-calendar__detail-row">
        <span className="apt-calendar__detail-label">Bác sĩ</span>
        <span className="apt-calendar__detail-value">
          {appointment.doctorId?.fullName || "Chưa phân công"}
        </span>
      </div>

      {appointment.note && (
        <div className="apt-calendar__detail-row">
          <span className="apt-calendar__detail-label">Ghi chú</span>
          <span className="apt-calendar__detail-value">{appointment.note}</span>
        </div>
      )}

      {appointment.approvedAt && (
        <div className="apt-calendar__detail-row">
          <span className="apt-calendar__detail-label">Xác nhận lúc</span>
          <span className="apt-calendar__detail-value">
            {new Date(appointment.approvedAt).toLocaleString("vi-VN")}
          </span>
        </div>
      )}

      {appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT && (
        <div className="apt-calendar__countdown-box">
          <AppointmentPaymentCountdown
            appointment={appointment}
            showCountdown={true}
            onExpire={(expiredApt) => {
              onPaymentExpired?.(expiredApt);
            }}
          />
        </div>
      )}

      {isCompleted && hasReview && (
        <div className="apt-feedback-preview">
          <span>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                style={{
                  color: s <= existingFeedback.point ? "#f59e0b" : "#d1d5db",
                  fontSize: "16px",
                }}
              >
                ★
              </span>
            ))}
          </span>
          {existingFeedback.comment && (
            <span className="apt-feedback-preview__comment">
              "{existingFeedback.comment}"
            </span>
          )}
        </div>
      )}

      {!hasReview && isCompleted && (
        <div className="apt-calendar__review-prompt">
          Lịch hẹn này chưa được đánh giá.
        </div>
      )}

      <div className="apt-card-actions">
        {appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT && (
          <button
            onClick={onPayNow}
            disabled={isPayLoading || isExpired}
            className="flex-1 min-w-24 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {isPayLoading ? "Loading..." : "Complete Payment"}
          </button>
        )}

        {canCancel && (
          <button
            onClick={onCancel}
            disabled={isExpired}
            className="flex-1 min-w-24 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
        )}

        {isCompleted && (
          <button
            onClick={onGoFeedback}
            className={
              hasReview
                ? "apt-feedback-btn apt-feedback-btn--viewed"
                : "apt-feedback-btn apt-feedback-btn--new"
            }
          >
            {hasReview ? "Xem đánh giá" : "Đánh giá ngay"}
          </button>
        )}
      </div>
    </div>
  );
}
