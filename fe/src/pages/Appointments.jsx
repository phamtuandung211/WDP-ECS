import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appointmentService } from "../services";
import { Loading, Alert } from "../components/UI";
import { BasicAppointmentForm } from "../components/appointment/BasicAppointmentForm";
import { AdvancedAppointmentForm } from "../components/appointment/AdvancedAppointmentForm";
import { AppointmentPaymentCountdown } from "../components/appointment/AppointmentTracking";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../constants/appointment";

export function Appointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'basic', 'advanced'
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Fetch appointments
  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filterStatus !== "all") params.status = filterStatus;
        if (filterType !== "all") params.type = filterType;

        const response = await appointmentService.getAll(params);
        setAppointments(response.data?.data || response.data || []);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, filterStatus, filterType]);

  const handleBookingSuccess = (newAppointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    setActiveTab("list");
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
              <label className="block text-sm font-medium mb-1">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                {Object.entries(APPOINTMENT_STATUS).map(([key, value]) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value={APPOINTMENT_TYPE.BASIC}>Basic</option>
                <option value={APPOINTMENT_TYPE.ADVANCED}>Advanced</option>
              </select>
            </div>
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
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt._id}
                  appointment={apt}
                  onCancel={() => handleCancel(apt._id)}
                  onPayNow={() => navigate(`/payment?appointmentId=${apt._id}`)}
                />
              ))}
            </div>
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

// Appointment Card Component
function AppointmentCard({ appointment, onCancel }) {
  const [isPayLoading, setIsPayLoading] = useState(false);
  const navigate = useNavigate();
  const statusLabel = STATUS_LABELS[appointment.status] || appointment.status;
  const statusColor = STATUS_COLORS[appointment.status] || "bg-gray-100";

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (slot) => {
    if (!slot) return "TBD";
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

  const canCancel = appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT;

  const handlePayNow = async () => {
    setIsPayLoading(true);
    try {
      navigate(`/payment?appointmentId=${appointment._id}`);
    } finally {
      setIsPayLoading(false);
    }
  };

  return (
    <div className="appointment-card border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">
            {appointment.type === APPOINTMENT_TYPE.BASIC ? "Basic" : "Advanced"}{" "}
            Appointment
          </h3>
          <p className="text-sm text-gray-500">
            ID: {appointment._id?.slice(-8)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Payment Countdown */}
      {appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT && (
        <div className="mb-3">
          <AppointmentPaymentCountdown
            appointment={appointment}
            showCountdown={true}
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">
            {formatDate(
              appointment.desiredDate || appointment.slotId?.startTime,
            )}
          </span>
        </div>

        {appointment.slotId && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium">
              {formatTime(appointment.slotId)}
            </span>
          </div>
        )}

        {appointment.doctorId && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Doctor:</span>
            <span className="font-medium">
              {appointment.doctorId?.fullName || "Assigned"}
            </span>
          </div>
        )}

        {appointment.approvedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Confirmed:</span>
            <span className="font-medium">
              {new Date(appointment.approvedAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {appointment.paymentExpireAt &&
          appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pay by:</span>
              <span className="font-medium text-red-600">
                {new Date(appointment.paymentExpireAt).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </div>
          )}

        {appointment.note && (
          <div className="text-sm">
            <span className="text-gray-600">Notes: </span>
            <span className="italic">{appointment.note}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {appointment.status === APPOINTMENT_STATUS.PENDING_PAYMENT && (
          <button
            onClick={handlePayNow}
            disabled={isPayLoading}
            className="flex-1 min-w-24 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {isPayLoading ? "Loading..." : "Complete Payment"}
          </button>
        )}

        {canCancel && (
          <button
            onClick={onCancel}
            className="flex-1 min-w-24 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Cancel
          </button>
        )}

        {appointment.status === APPOINTMENT_STATUS.COMPLETED && (
          <button
            onClick={() => {
              navigate(`/feedback?appointmentId=${appointment._id}`);
            }}
            className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            Leave Feedback
          </button>
        )}
      </div>
    </div>
  );
}
