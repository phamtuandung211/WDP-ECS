import React, { useEffect, useState } from "react";
import { appointmentService, medicalRecordService } from "../../services";
import { APPOINTMENT_STATUS, STATUS_LABELS } from "../../constants/appointment";
import { Loading, Alert } from "../UI";
import { useAppointmentNotificationRefresh } from "../../context/AppointmentNotificationContext";
import "./DoctorAppointmentDashboard.css";

// eslint-disable-next-line sonarjs/cognitive-complexity
export function DoctorAppointmentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("today");
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [medicalFormData, setMedicalFormData] = useState({
    symptoms: "",
    diagnosis: "",
    prescription: "",
    notes: "",
  });
  const [savingRecord, setSavingRecord] = useState(false);

  const toDateKey = (value) => {
    if (!value) return "";
    return new Date(value).toISOString().split("T")[0];
  };

  const todayDate = new Date();
  const todayKey = toDateKey(todayDate);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrowDate);

  const plusDaysKey = (days) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + days);
    return toDateKey(d);
  };

  const upcomingFromKey = plusDaysKey(2);
  const upcomingToKey = plusDaysKey(5);
  const weekToKey = plusDaysKey(6);

  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await appointmentService.getAllForStaff({
        status: APPOINTMENT_STATUS.CONFIRMED,
        limit: 200,
      });

      setAppointments(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useAppointmentNotificationRefresh({
    onAssigned: () =>
      fetchAppointments().catch((err) => console.warn("Refresh failed:", err)),
  });

  const filteredAppointments = appointments
    .filter((apt) => {
      const aptDateKey = toDateKey(apt.slotId?.startTime);
      if (!aptDateKey) return false;

      if (viewMode === "today") return aptDateKey === todayKey;
      if (viewMode === "tomorrow") return aptDateKey === tomorrowKey;
      if (viewMode === "upcoming") {
        return aptDateKey >= upcomingFromKey && aptDateKey <= upcomingToKey;
      }
      if (viewMode === "week") {
        return aptDateKey >= todayKey && aptDateKey <= weekToKey;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.slotId?.startTime || 0).getTime() -
        new Date(b.slotId?.startTime || 0).getTime(),
    );

  useEffect(() => {
    if (!filteredAppointments.length) {
      setSelectedAppointment(null);
      setMedicalRecord(null);
      setShowMedicalForm(false);
      return;
    }

    const stillVisible = filteredAppointments.find(
      (apt) => apt._id === selectedAppointment?._id,
    );

    if (!stillVisible) {
      handleSelectAppointment(filteredAppointments[0]);
    }
  }, [viewMode, appointments]);

  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const key = toDateKey(apt.slotId?.startTime) || "N/A";
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedAppointments).sort((a, b) =>
    a.localeCompare(b),
  );

  const getAppointmentState = (apt) => {
    const now = new Date();
    const start = new Date(apt.slotId?.startTime);
    if (Number.isNaN(start.getTime())) return "upcoming";
    if (start <= now) return "done";
    return "upcoming";
  };

  const nextAppointment = filteredAppointments.find(
    (apt) => new Date(apt.slotId?.startTime).getTime() >= Date.now(),
  );

  const handleSelectAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowMedicalForm(false);
    setMedicalFormData({
      symptoms: "",
      diagnosis: "",
      prescription: "",
      notes: "",
    });

    // Try to load existing medical record
    try {
      const response = await medicalRecordService.getByAppointment(
        appointment._id,
      );
      if (response.data?.data) {
        const record = response.data.data;
        setMedicalRecord(record);
        setMedicalFormData({
          symptoms: record.symptoms || "",
          diagnosis: record.diagnosis || "",
          prescription: record.prescription || "",
          notes: record.notes || "",
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // No medical record yet, that's fine
        setMedicalRecord(null);
      } else {
        console.error("Failed to load medical record", err);
        setError("Failed to load medical record");
      }
    }
  };

  const handleSaveMedicalRecord = async (e) => {
    e.preventDefault();

    if (!medicalFormData.symptoms || !medicalFormData.diagnosis) {
      alert("Please fill in symptoms and diagnosis");
      return;
    }

    // Check appointment time - must be at or after start time
    const now = new Date();
    const appointmentStart = new Date(selectedAppointment.slotId?.startTime);

    if (now < appointmentStart) {
      const timeLeft = Math.ceil((appointmentStart - now) / 60000);
      alert(
        `Appointment starts in ${timeLeft} minutes. Cannot create medical record yet.`,
      );
      return;
    }

    try {
      setSavingRecord(true);
      const payload = {
        appointmentId: selectedAppointment._id,
        symptoms: medicalFormData.symptoms,
        diagnosis: medicalFormData.diagnosis,
        prescription: medicalFormData.prescription,
        notes: medicalFormData.notes,
      };

      if (medicalRecord) {
        const response = await medicalRecordService.update(
          medicalRecord._id,
          payload,
        );
        setMedicalRecord(response.data?.data || payload);
      } else {
        const response = await medicalRecordService.create(payload);
        setMedicalRecord(response.data?.data || payload);
      }

      alert("Medical record saved successfully");
      setShowMedicalForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save medical record");
    } finally {
      setSavingRecord(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!medicalRecord) {
      alert(
        "Cannot complete appointment without a medical record. Please add one first.",
      );
      return;
    }

    // Check appointment time - must be at or after start time
    const now = new Date();
    const appointmentStart = new Date(selectedAppointment.slotId?.startTime);

    if (now < appointmentStart) {
      const timeLeft = Math.ceil((appointmentStart - now) / 60000);
      alert(`Appointment starts in ${timeLeft} minutes. Cannot complete yet.`);
      return;
    }

    if (!globalThis.confirm("Mark this appointment as completed?")) {
      return;
    }

    try {
      await appointmentService.complete(appointmentId);
      setAppointments((prev) =>
        prev.filter((apt) => apt._id !== appointmentId),
      );
      setSelectedAppointment(null);
      setMedicalRecord(null);
      alert("Appointment marked as completed");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete appointment");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatHeaderDate = () =>
    new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "CU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
  };

  const getListPillText = (apt) => {
    if (nextAppointment?._id === apt._id) return "Next";
    return getAppointmentState(apt) === "done" ? "Done" : "Upcoming";
  };

  const getListPillClass = (apt) => {
    if (nextAppointment?._id === apt._id) return "pill-next";
    return getAppointmentState(apt) === "done" ? "pill-done" : "pill-upcoming";
  };

  const formatTime = (slot) => {
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

  const isAppointmentTimeArrived = () => {
    if (!selectedAppointment?.slotId?.startTime) return false;
    const now = new Date();
    const appointmentStart = new Date(selectedAppointment.slotId.startTime);
    return now >= appointmentStart;
  };

  const getTimeLeftMessage = () => {
    if (!selectedAppointment?.slotId?.startTime) return "";
    const now = new Date();
    const appointmentStart = new Date(selectedAppointment.slotId.startTime);
    if (now >= appointmentStart) return "Ready to proceed";
    const timeLeft = Math.ceil((appointmentStart - now) / 60000);
    return `Appointment starts in ${timeLeft} minutes`;
  };

  const hasMedicalRecord = Boolean(medicalRecord);
  const timeArrived = isAppointmentTimeArrived();
  const canComplete = timeArrived && hasMedicalRecord;

  let completeButtonTitle = "Click to complete appointment";
  if (!hasMedicalRecord) {
    completeButtonTitle = "Medical record required";
  } else if (!timeArrived) {
    completeButtonTitle = "Appointment time not reached";
  }

  const completeButtonText = hasMedicalRecord
    ? "Mark as Completed"
    : "Add Medical Record to Complete";

  let medicalSectionContent = (
    <div className="ddoc-record-empty">
      <p>No medical record yet. Add one to document the appointment.</p>
      <div className="ddoc-ready-banner">
        <div>
          <div className="ddoc-ready-label">
            {timeArrived ? "Ready to proceed" : getTimeLeftMessage()}
          </div>
          <div className="ddoc-ready-sub">Add Medical Record to Complete</div>
        </div>
      </div>
    </div>
  );

  if (showMedicalForm) {
    medicalSectionContent = (
      <form
        onSubmit={handleSaveMedicalRecord}
        className="ddoc-record-form show"
      >
        <div className="ddoc-form-group">
          <label className="ddoc-form-label" htmlFor="symptoms">
            Symptoms <span className="required">*</span>
          </label>
          <textarea
            id="symptoms"
            value={medicalFormData.symptoms}
            onChange={(e) =>
              setMedicalFormData((prev) => ({
                ...prev,
                symptoms: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="ddoc-form-group">
          <label className="ddoc-form-label" htmlFor="diagnosis">
            Diagnosis <span className="required">*</span>
          </label>
          <textarea
            id="diagnosis"
            value={medicalFormData.diagnosis}
            onChange={(e) =>
              setMedicalFormData((prev) => ({
                ...prev,
                diagnosis: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="ddoc-form-group">
          <label className="ddoc-form-label" htmlFor="prescription">
            Prescription
          </label>
          <textarea
            id="prescription"
            value={medicalFormData.prescription}
            onChange={(e) =>
              setMedicalFormData((prev) => ({
                ...prev,
                prescription: e.target.value,
              }))
            }
          />
        </div>

        <div className="ddoc-form-group">
          <label className="ddoc-form-label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={medicalFormData.notes}
            onChange={(e) =>
              setMedicalFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
          />
        </div>

        <div className="ddoc-btn-row">
          <button
            type="submit"
            disabled={savingRecord}
            className="ddoc-btn ddoc-btn-primary"
          >
            {savingRecord ? "Saving..." : "Save Record"}
          </button>
          <button
            type="button"
            onClick={() => setShowMedicalForm(false)}
            className="ddoc-btn ddoc-btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  } else if (hasMedicalRecord) {
    medicalSectionContent = (
      <div className="ddoc-record-card show">
        <div className="ddoc-record-card-head">
          <div className="rc-title">Medical record saved</div>
          <button
            type="button"
            className="ddoc-btn-edit-record"
            onClick={() => setShowMedicalForm(true)}
          >
            Edit
          </button>
        </div>
        <div className="ddoc-record-card-body">
          <div className="ddoc-rc-row">
            <span className="ddoc-rc-label">Symptoms</span>
            <span className="ddoc-rc-value">
              {medicalRecord.symptoms || "-"}
            </span>
          </div>
          <div className="ddoc-rc-row">
            <span className="ddoc-rc-label">Diagnosis</span>
            <span className="ddoc-rc-value">
              {medicalRecord.diagnosis || "-"}
            </span>
          </div>
          <div className="ddoc-rc-row">
            <span className="ddoc-rc-label">Prescription</span>
            <span className="ddoc-rc-value">
              {medicalRecord.prescription || "-"}
            </span>
          </div>
          <div className="ddoc-rc-row">
            <span className="ddoc-rc-label">Notes</span>
            <span className="ddoc-rc-value">{medicalRecord.notes || "-"}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading && appointments.length === 0) return <Loading />;

  return (
    <div className="ddoc-root">
      <div className="ddoc-header">
        <div className="ddoc-header-left">
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
            <path
              d="M10 9v5M7.5 11.5h5"
              stroke="#5f5e5a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="ddoc-header-title">My Appointments</span>
        </div>
        <div className="ddoc-header-sub">Bác sĩ . {formatHeaderDate()}</div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="ddoc-filter-tabs">
        {["today", "tomorrow", "upcoming", "week"].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`ddoc-tab-btn ${viewMode === mode ? "active" : ""}`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="ddoc-stat-bar">
        <span className="count">
          {filteredAppointments.length} Confirmed Appointment
          {filteredAppointments.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="ddoc-layout">
        <div className="ddoc-panel">
          <div className="ddoc-panel-head">
            <span>Danh sách lịch hẹn</span>
          </div>

          <div className="ddoc-appt-scroll">
            {groupKeys.length === 0 ? (
              <div className="ddoc-empty-list">Không có lịch hẹn nào</div>
            ) : (
              groupKeys.map((key) => (
                <div key={key}>
                  <div className="ddoc-group-date">{formatDate(key)}</div>
                  {groupedAppointments[key].map((apt) => (
                    <button
                      type="button"
                      key={apt._id}
                      onClick={() => handleSelectAppointment(apt)}
                      className={`ddoc-appt-item ${selectedAppointment?._id === apt._id ? "active" : ""}`}
                    >
                      <div className="ddoc-appt-avatar">
                        {getInitials(apt.customerId?.fullName || "Customer")}
                      </div>
                      <div className="ddoc-appt-body">
                        <div className="ddoc-appt-name">
                          {apt.customerId?.fullName || "Customer"}
                        </div>
                        <div className="ddoc-appt-meta">
                          <span>{formatTime(apt.slotId)}</span>
                        </div>
                      </div>
                      <span className={`pill ${getListPillClass(apt)}`}>
                        {getListPillText(apt)}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ddoc-panel">
          <div className="ddoc-panel-head">
            <span>
              {selectedAppointment?.customerId?.fullName || "Chi tiết lịch hẹn"}
            </span>
            <span className="pill pill-confirmed">
              {STATUS_LABELS[APPOINTMENT_STATUS.CONFIRMED]}
            </span>
          </div>

          <div className="ddoc-detail-scroll">
            <div className="ddoc-detail-body">
              {selectedAppointment ? (
                <>
                  <div className="ddoc-section-title">Patient Information</div>
                  <div className="ddoc-info-grid">
                    <div className="ddoc-info-item">
                      <div className="ddoc-info-label">Name</div>
                      <span>
                        {selectedAppointment.customerId?.fullName || "-"}
                      </span>
                    </div>
                    <div className="ddoc-info-item">
                      <div className="ddoc-info-label">Phone</div>
                      <span>
                        {selectedAppointment.customerId?.phone || "-"}
                      </span>
                    </div>
                    <div className="ddoc-info-item full-width">
                      <div className="ddoc-info-label">Email</div>
                      <span>
                        {selectedAppointment.customerId?.email || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="ddoc-section-title">Patient Notes</div>
                  <div className="ddoc-notes-box">
                    {selectedAppointment.note || "No notes"}
                  </div>

                  <hr className="ddoc-divider" />

                  <div className="ddoc-section-title">Appointment Details</div>
                  <div className="ddoc-detail-row">
                    <div className="ddoc-detail-chip">
                      <strong>
                        {formatDate(selectedAppointment.slotId?.startTime)}
                      </strong>
                    </div>
                    <div className="ddoc-detail-chip">
                      <strong>{formatTime(selectedAppointment.slotId)}</strong>
                    </div>
                    <div className="ddoc-detail-chip">
                      <strong>
                        {STATUS_LABELS[selectedAppointment.status]}
                      </strong>
                    </div>
                  </div>

                  <hr className="ddoc-divider" />

                  <div className="ddoc-record-head-row">
                    <div className="ddoc-section-title no-margin">
                      Medical Records
                    </div>
                    {!showMedicalForm && (
                      <button
                        type="button"
                        className="ddoc-btn-add-record"
                        onClick={() => setShowMedicalForm(true)}
                        disabled={!isAppointmentTimeArrived()}
                      >
                        {medicalRecord ? "Edit" : "Add"} Record
                      </button>
                    )}
                  </div>

                  {medicalSectionContent}

                  {!showMedicalForm && selectedAppointment && (
                    <div
                      className={`ddoc-time-status ${
                        timeArrived ? "success" : "warning"
                      }`}
                    >
                      {getTimeLeftMessage()}
                    </div>
                  )}

                  {!showMedicalForm && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCompleteAppointment(selectedAppointment._id)
                      }
                      disabled={!canComplete}
                      className={`ddoc-complete-btn ${
                        canComplete ? "active" : "disabled"
                      }`}
                      title={completeButtonTitle}
                    >
                      {completeButtonText}
                    </button>
                  )}
                </>
              ) : (
                <div className="ddoc-empty-detail">
                  Select an appointment to view details and manage medical
                  records
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
