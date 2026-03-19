import React, { useEffect, useState } from "react";
import { appointmentService, slotService, doctorService } from "../../services";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  STATUS_LABELS,
} from "../../constants/appointment";
import { Loading, Alert } from "../UI";
import { useAppointmentNotificationRefresh } from "../../context/AppointmentNotificationContext";

export function SaleStaffAppointmentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    doctorId: "",
    slotId: "",
    date: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

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
    onWaitingAssign: () => fetchAppointments().catch((err) => console.warn("Refresh failed:", err)),
  });

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

  return (
    <div className="sale-staff-dashboard">
      <h2 className="text-3xl font-bold mb-6">
        Appointment Assignment Dashboard
      </h2>

      {error && <Alert type="error">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Waiting Appointments */}
        <div className="lg:col-span-1 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {appointments.length} Waiting Assignments
          </h3>

          {appointments.length === 0 ? (
            <p className="text-gray-500">
              No appointments waiting for assignment
            </p>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <button
                  key={apt._id}
                  onClick={() => handleSelectAppointment(apt)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    selectedAppointment?._id === apt._id
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-blue-50 border border-gray-200"
                  }`}
                >
                  <div className="font-medium">
                    {apt.customerId?.fullName || "Customer"}
                  </div>
                  <div className="text-xs opacity-75">
                    {apt.type === APPOINTMENT_TYPE.BASIC ? "BASIC" : "ADVANCED"}
                  </div>
                  <div className="text-xs opacity-75">
                    {formatDate(apt.desiredDate)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Assignment Form */}
        <div className="lg:col-span-2 border rounded-lg p-4">
          {selectedAppointment ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Assign Doctor & Slot
              </h3>

              {/* Customer Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Name:</strong>{" "}
                    {selectedAppointment.customerId?.fullName}
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    {selectedAppointment.customerId?.phone}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedAppointment.customerId?.email}
                  </div>
                  <div>
                    <strong>Type:</strong>{" "}
                    {selectedAppointment.type === APPOINTMENT_TYPE.BASIC
                      ? "BASIC - Date selection only"
                      : "ADVANCED - Doctor & Slot selection"}
                  </div>
                  {selectedAppointment.note && (
                    <div>
                      <strong>Notes:</strong> {selectedAppointment.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Form */}
              <form onSubmit={handleApprove} className="space-y-4">
                {/* Doctor Selection */}
                <div>
                  <label
                    htmlFor="doctorId"
                    className="block text-sm font-medium mb-2"
                  >
                    Assign Doctor <span className="text-red-500">*</span>
                  </label>
                  {doctors.length === 0 ? (
                    <Alert type="warning">No doctors available</Alert>
                  ) : (
                    <select
                      id="doctorId"
                      name="doctorId"
                      value={assignmentData.doctorId}
                      onChange={handleAssignmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a Doctor --</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.fullName} -{" "}
                          {doctor.specialization?.name || "No Specialization"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date Selection */}
                {selectedAppointment.type === APPOINTMENT_TYPE.BASIC && (
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium mb-2"
                    >
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={assignmentData.date}
                      min={today}
                      onChange={handleAssignmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Slot Selection */}
                {assignmentData.date && assignmentData.doctorId && (
                  <div>
                    <label
                      htmlFor="slotId"
                      className="block text-sm font-medium mb-2"
                    >
                      Time Slot <span className="text-red-500">*</span>
                    </label>
                    {slotsLoading ? (
                      <p className="text-sm text-gray-500">Loading slots...</p>
                    ) : availableSlots.length === 0 ? (
                      <Alert type="warning">
                        No available slots for the selected date and doctor
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map((slot) => {
                          const remaining = slot.maxPatients - slot.bookedCount;
                          const isFull = remaining <= 0;

                          return (
                            <label
                              key={slot._id}
                              className={`flex items-center p-3 border rounded-md cursor-pointer transition ${
                                assignmentData.slotId === slot._id
                                  ? "border-blue-500 bg-blue-50"
                                  : isFull
                                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                    : "border-gray-300 hover:border-blue-400"
                              }`}
                            >
                              <input
                                type="radio"
                                name="slotId"
                                value={slot._id}
                                checked={assignmentData.slotId === slot._id}
                                onChange={handleAssignmentChange}
                                disabled={isFull}
                                className="mr-3"
                              />
                              <div>
                                <div className="font-medium text-sm">
                                  {formatSlotTime(slot)}
                                </div>
                                <div
                                  className={`text-xs ${
                                    isFull ? "text-red-500" : "text-green-600"
                                  }`}
                                >
                                  {isFull ? "FULL" : `${remaining} spots`}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !assignmentData.doctorId ||
                      !assignmentData.slotId
                    }
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? "Assigning..." : "Approve & Assign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select an appointment to assign a doctor and time slot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
