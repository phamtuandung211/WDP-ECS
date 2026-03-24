import React, { useEffect, useState } from "react";
import { appointmentService, slotService, doctorService } from "../../services";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
} from "../../constants/appointment";
import { Loading, Alert } from "../UI";
import { useAppointmentNotificationRefresh } from "../../context/AppointmentNotificationContext";
import "./SaleStaffAppointmentDashboard.css";

// eslint-disable-next-line sonarjs/cognitive-complexity
export function SaleStaffAppointmentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState("all");
  const [filterDay, setFilterDay] = useState("");
  const [filterWeekFrom, setFilterWeekFrom] = useState("");
  const [filterWeekTo, setFilterWeekTo] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    doctorId: "",
    slotId: "",
    date: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setFilterDay(today);
    setFilterWeekFrom(today);
    setFilterWeekTo(today);
    setFilterMonth(today.slice(0, 7));
  }, [today]);

  // Fetch waiting assignments and doctors
  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getAllDoctor();
      setDoctors(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Failed to load doctors:", err);
      setError("Failed to load doctors list");
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllForStaff({
        status: APPOINTMENT_STATUS.WAITING_ASSIGN,
      });
      setAppointments(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load appointments waiting for assignment");
    } finally {
      setLoading(false);
    }
  };

  useAppointmentNotificationRefresh({
    onWaitingAssign: () =>
      fetchAppointments().catch((err) => console.warn("Refresh failed:", err)),
  });

  const inRange = (dateValue) => {
    if (filterMode === "all") return true;
    if (!dateValue) return false;
    const date = dateValue.split("T")[0];

    if (filterMode === "day") {
      return date === filterDay;
    }

    if (filterMode === "week") {
      if (!filterWeekFrom || !filterWeekTo) return true;
      return date >= filterWeekFrom && date <= filterWeekTo;
    }

    if (filterMode === "month") {
      if (!filterMonth) return true;
      return date.startsWith(filterMonth);
    }

    return true;
  };

  const visibleAppointments = appointments.filter((apt) =>
    inRange(apt.desiredDate || apt.date || apt.createdAt),
  );

  // Load slots when date and doctor are selected
  useEffect(() => {
    if (
      !assignmentData.date ||
      !assignmentData.doctorId ||
      !selectedAppointment
    ) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        const response = await slotService.getAvailable({
          date: assignmentData.date,
          doctorId: assignmentData.doctorId,
        });
        setAvailableSlots(response.data?.data || response.data || []);
      } catch (err) {
        setError("Failed to load available slots");
        console.error(err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [assignmentData.date, assignmentData.doctorId, selectedAppointment]);

  const handleSelectAppointment = (appointment) => {
    const desiredDate = appointment.desiredDate?.split("T")[0] || "";
    const selectedDate =
      appointment.type === APPOINTMENT_TYPE.BASIC &&
      desiredDate &&
      desiredDate < today
        ? today
        : desiredDate;

    setSelectedAppointment(appointment);
    setAssignmentData({
      doctorId: "",
      slotId: "",
      date: selectedDate,
    });
    setAvailableSlots([]);
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData((prev) => ({
      ...prev,
      [name]: value,
      // Reset slot if date or doctor changes
      ...(name === "date" || name === "doctorId" ? { slotId: "" } : {}),
    }));
  };

  const handleApprove = async (e) => {
    e.preventDefault();

    if (!assignmentData.doctorId || !assignmentData.slotId) {
      alert("Please select both doctor and time slot");
      return;
    }

    if (
      selectedAppointment?.type === APPOINTMENT_TYPE.BASIC &&
      assignmentData.date &&
      assignmentData.date < today
    ) {
      alert("Cannot assign a past date for BASIC appointment");
      return;
    }

    try {
      setLoading(true);
      await appointmentService.approve(selectedAppointment._id, {
        doctorId: assignmentData.doctorId,
        slotId: assignmentData.slotId,
      });

      alert("Appointment approved and assigned successfully!");
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to approve appointment";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && appointments.length === 0) return <Loading />;

  const handleSkip = () => {
    if (!selectedAppointment || visibleAppointments.length === 0) return;
    const currentIndex = visibleAppointments.findIndex(
      (apt) => apt._id === selectedAppointment._id,
    );
    if (currentIndex === -1 || visibleAppointments.length === 1) return;
    const nextIndex =
      currentIndex === visibleAppointments.length - 1 ? 0 : currentIndex + 1;
    handleSelectAppointment(visibleAppointments[nextIndex]);
  };

  const todayText = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSlotTime = (slot) => {
    if (!slot) return "N/A";
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

  const renderSlotCards = (slots, label) => {
    if (slots.length === 0) return null;
    return (
      <div className="ssad-slot-period">
        <div className="ssad-slot-period-label">{label}</div>
        <div className="ssad-slot-grid">
          {slots.map((slot) => {
            const remaining = slot.maxPatients - slot.bookedCount;
            const isFull = remaining <= 0;
            const isSelected = assignmentData.slotId === slot._id;
            const isLow = !isFull && remaining === 1;

            return (
              <label
                key={slot._id}
                className={`ssad-slot-card ${isSelected ? "selected" : ""} ${isLow ? "low" : ""} ${isFull ? "full" : ""}`}
              >
                <input
                  type="radio"
                  name="slotId"
                  value={slot._id}
                  checked={isSelected}
                  onChange={handleAssignmentChange}
                  disabled={isFull}
                />
                <div className="ssad-slot-time">{formatSlotTime(slot)}</div>
                <div className="ssad-slot-spots">
                  {isFull ? "FULL" : `${remaining} chỗ trống`}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const morningSlots = availableSlots.filter((slot) => {
    const hour = new Date(slot.startTime).getHours();
    return hour < 12;
  });

  const afternoonSlots = availableSlots.filter((slot) => {
    const hour = new Date(slot.startTime).getHours();
    return hour >= 12;
  });

  const selectedSlot = availableSlots.find(
    (slot) => slot._id === assignmentData.slotId,
  );

  let slotContent = (
    <div className="ssad-slot-placeholder">
      Chon bac si va ngay de xem slot trong
    </div>
  );

  if (assignmentData.date && assignmentData.doctorId) {
    if (slotsLoading) {
      slotContent = (
        <div className="ssad-slot-placeholder">Dang tai slot...</div>
      );
    } else if (availableSlots.length === 0) {
      slotContent = (
        <div className="ssad-slot-placeholder error">
          Khong co slot trong cho bac si va ngay da chon
        </div>
      );
    } else {
      slotContent = (
        <>
          {renderSlotCards(morningSlots, "Buoi sang")}
          {renderSlotCards(afternoonSlots, "Buoi chieu")}
        </>
      );
    }
  }

  return (
    <div className="ssad-root">
      <div className="ssad-header">
        <div className="ssad-header-left">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect
              x="3"
              y="4"
              width="14"
              height="14"
              rx="2"
              stroke="#5f5e5a"
              strokeWidth="1.2"
            />
            <path
              d="M7 2v4M13 2v4M3 9h14"
              stroke="#5f5e5a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="ssad-header-title">Appointment Assignment</span>
          <span className="ssad-badge-count">{appointments.length}</span>
        </div>
        <div className="ssad-header-date">Staff portal . {todayText}</div>
      </div>

      <div className="ssad-stat-row">
        <div className="ssad-stat ssad-warn">
          <div className="ssad-val orange">{appointments.length}</div>
          <div className="ssad-lbl">Cho duyet</div>
        </div>
        <div className="ssad-stat">
          <div className="ssad-val green">{doctors.length}</div>
          <div className="ssad-lbl">Bac si hoat dong</div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="ssad-layout">
        <div className="ssad-panel">
          <div className="ssad-panel-head">
            <span className="ssad-active-dot" /> Hang cho duyet
          </div>

          <div className="ssad-filter-bar">
            <button
              type="button"
              className={`ssad-filter-btn ${filterMode === "all" ? "active" : ""}`}
              onClick={() => setFilterMode("all")}
            >
              Tat ca
            </button>
            <button
              type="button"
              className={`ssad-filter-btn ${filterMode === "day" ? "active" : ""}`}
              onClick={() => setFilterMode("day")}
            >
              Ngay
            </button>
            <button
              type="button"
              className={`ssad-filter-btn ${filterMode === "week" ? "active" : ""}`}
              onClick={() => setFilterMode("week")}
            >
              Tuan
            </button>
            <button
              type="button"
              className={`ssad-filter-btn ${filterMode === "month" ? "active" : ""}`}
              onClick={() => setFilterMode("month")}
            >
              Thang
            </button>
          </div>

          {filterMode === "day" && (
            <div className="ssad-filter-extra show">
              <label htmlFor="filterDay">Ngay:</label>
              <input
                id="filterDay"
                type="date"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              />
            </div>
          )}

          {filterMode === "week" && (
            <div className="ssad-filter-extra show">
              <label htmlFor="filterWeekFrom">Tu:</label>
              <input
                id="filterWeekFrom"
                type="date"
                value={filterWeekFrom}
                onChange={(e) => setFilterWeekFrom(e.target.value)}
              />
              <span className="ssad-filter-sep">-&gt;</span>
              <input
                id="filterWeekTo"
                type="date"
                value={filterWeekTo}
                onChange={(e) => setFilterWeekTo(e.target.value)}
              />
            </div>
          )}

          {filterMode === "month" && (
            <div className="ssad-filter-extra show">
              <label htmlFor="filterMonth">Thang:</label>
              <input
                id="filterMonth"
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          )}

          {filterMode !== "all" && (
            <div className="ssad-filter-info">
              Hien thi {visibleAppointments.length} lich hen
            </div>
          )}

          <div className="ssad-queue-scroll">
            {visibleAppointments.length === 0 ? (
              <div className="ssad-empty-state">
                Khong co lich hen nao trong khoang nay
              </div>
            ) : (
              visibleAppointments.map((apt) => (
                <button
                  type="button"
                  key={apt._id}
                  onClick={() => handleSelectAppointment(apt)}
                  className={`ssad-queue-item ${selectedAppointment?._id === apt._id ? "active" : ""}`}
                >
                  <div className="ssad-qname">
                    {apt.customerId?.fullName || "Customer"}
                  </div>
                  <div className="ssad-meta">
                    <span className="ssad-pill ssad-pill-basic">
                      {apt.type === APPOINTMENT_TYPE.BASIC
                        ? "BASIC"
                        : "ADVANCED"}
                    </span>
                    <span className="ssad-date-text">
                      {formatDate(apt.desiredDate)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="ssad-panel">
          <div className="ssad-panel-head">Chi tiet va Gan lich</div>
          <div className="ssad-form-section">
            {selectedAppointment ? (
              <>
                <div className="ssad-section-title">Thong tin khach hang</div>
                <div className="ssad-info-grid">
                  <div className="ssad-info-item">
                    <div className="ssad-info-label">Ho ten</div>
                    <span>
                      {selectedAppointment.customerId?.fullName || "-"}
                    </span>
                  </div>
                  <div className="ssad-info-item">
                    <div className="ssad-info-label">Dien thoai</div>
                    <span>{selectedAppointment.customerId?.phone || "-"}</span>
                  </div>
                  <div className="ssad-info-item">
                    <div className="ssad-info-label">Email</div>
                    <span>{selectedAppointment.customerId?.email || "-"}</span>
                  </div>
                  <div className="ssad-info-item">
                    <div className="ssad-info-label">Loai</div>
                    <span>
                      {selectedAppointment.type === APPOINTMENT_TYPE.BASIC
                        ? "BASIC - Chon ngay"
                        : "ADVANCED - Chon bac si va slot"}
                    </span>
                  </div>
                </div>

                <div className="ssad-section-title">Ghi chu</div>
                <div className="ssad-notes-box">
                  {selectedAppointment.note || "-"}
                </div>

                <hr className="ssad-divider" />

                <div className="ssad-section-title">Gan bac si va slot</div>

                <form onSubmit={handleApprove}>
                  <div className="ssad-form-group">
                    <label htmlFor="doctorId" className="ssad-form-label">
                      Bac si <span className="required">*</span>
                    </label>
                    {doctors.length === 0 ? (
                      <Alert type="warning">No doctors available</Alert>
                    ) : (
                      <select
                        id="doctorId"
                        name="doctorId"
                        value={assignmentData.doctorId}
                        onChange={handleAssignmentChange}
                      >
                        <option value="">-- Chon bac si --</option>
                        {doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            {doctor.fullName} -{" "}
                            {doctor.specialization?.name || "Khong chuyen khoa"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedAppointment.type === APPOINTMENT_TYPE.BASIC && (
                    <div className="ssad-form-group">
                      <label htmlFor="date" className="ssad-form-label">
                        Ngay hen <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={assignmentData.date}
                        min={today}
                        onChange={handleAssignmentChange}
                      />
                    </div>
                  )}

                  <div className="ssad-form-group">
                    <label htmlFor="slotId" className="ssad-form-label">
                      Khung gio trong <span className="required">*</span>
                    </label>
                    {slotContent}

                    {selectedSlot && (
                      <div className="ssad-selected-slot-badge">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                        >
                          <circle
                            cx="6.5"
                            cy="6.5"
                            r="5.5"
                            stroke="#185fa5"
                            strokeWidth="1.2"
                          />
                          <path
                            d="M4 6.5l2 2 3-3"
                            stroke="#185fa5"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{formatSlotTime(selectedSlot)}</span>
                      </div>
                    )}
                  </div>

                  <div className="ssad-btn-row">
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !assignmentData.doctorId ||
                        !assignmentData.slotId
                      }
                      className="ssad-btn ssad-btn-primary"
                    >
                      {loading ? "Dang gan..." : "Duyet va Gan lich"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="ssad-btn ssad-btn-ghost"
                    >
                      Bo qua
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="ssad-empty-state">
                Chon mot lich hen de gan bac si va khung gio
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
