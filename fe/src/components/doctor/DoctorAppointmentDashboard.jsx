import React, { useEffect, useState } from "react";
import { appointmentService, medicalRecordService } from "../../services";
import {
  APPOINTMENT_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../../constants/appointment";
import { Loading, Alert } from "../UI";

export function DoctorAppointmentDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("today"); // 'today', 'week', 'month'
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [medicalFormData, setMedicalFormData] = useState({
    symptoms: "",
    diagnosis: "",
    prescription: "",
    notes: "",
  });
  const [savingRecord, setSavingRecord] = useState(false);

  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, [viewMode]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      let dateFilter = null;

      if (viewMode === "today") {
        dateFilter = now.toISOString().split("T")[0];
      }

      const response = await appointmentService.getAllForStaff({
        status: APPOINTMENT_STATUS.CONFIRMED,
        date: dateFilter,
      });

      setAppointments(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

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
        setMedicalRecord(response.data.data);
        const record = response.data.data;
        setMedicalFormData({
          symptoms: record.symptoms || "",
          diagnosis: record.diagnosis || "",
          prescription: record.prescription || "",
          notes: record.notes || "",
        });
      }
    } catch (err) {
      // No medical record yet, that's fine
      setMedicalRecord(null);
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
        await medicalRecordService.update(medicalRecord._id, payload);
      } else {
        await medicalRecordService.create(payload);
      }

      alert("Medical record saved successfully");
      setShowMedicalForm(false);
      setMedicalRecord(payload);
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

    if (!window.confirm("Mark this appointment as completed?")) {
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

  if (loading && appointments.length === 0) return <Loading />;

  return (
    <div className="doctor-dashboard">
      <h2 className="text-3xl font-bold mb-6">My Appointments</h2>

      {error && <Alert type="error">{error}</Alert>}

      {/* View Mode Selector */}
      <div className="flex gap-2 mb-6">
        {["today", "week", "month"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md capitalize transition ${
              viewMode === mode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Appointments List */}
        <div className="lg:col-span-1 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {appointments.length} Confirmed Appointments
          </h3>

          {appointments.length === 0 ? (
            <p className="text-gray-500">No confirmed appointments</p>
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
                    {formatDate(apt.slotId?.startTime)}
                  </div>
                  <div className="text-xs opacity-75">
                    {formatTime(apt.slotId)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Appointment Details & Medical Record */}
        <div className="lg:col-span-2 border rounded-lg p-4">
          {selectedAppointment ? (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">
                  Patient Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedAppointment.customerId?.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedAppointment.customerId?.phone}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedAppointment.customerId?.email}
                  </div>
                  {selectedAppointment.note && (
                    <div>
                      <span className="font-medium">Patient Notes:</span>{" "}
                      {selectedAppointment.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Appointment Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(selectedAppointment.slotId?.startTime)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{" "}
                    {formatTime(selectedAppointment.slotId)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        STATUS_COLORS[selectedAppointment.status]
                      }`}
                    >
                      {STATUS_LABELS[selectedAppointment.status]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Record */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Medical Records</h3>
                  {!showMedicalForm && (
                    <button
                      onClick={() => setShowMedicalForm(true)}
                      disabled={!isAppointmentTimeArrived()}
                      className={`px-3 py-1 text-sm rounded transition ${
                        !isAppointmentTimeArrived()
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      title={
                        !isAppointmentTimeArrived()
                          ? `Cannot add medical record yet. ${getTimeLeftMessage()}`
                          : ""
                      }
                    >
                      {medicalRecord ? "Edit" : "Add"} Record
                    </button>
                  )}
                </div>

                {!showMedicalForm && medicalRecord ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Symptoms:</span>
                      <p className="mt-1 text-gray-700">
                        {medicalRecord.symptoms}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Diagnosis:</span>
                      <p className="mt-1 text-gray-700">
                        {medicalRecord.diagnosis}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Prescription:</span>
                      <p className="mt-1 text-gray-700">
                        {medicalRecord.prescription}
                      </p>
                    </div>
                    {medicalRecord.notes && (
                      <div>
                        <span className="font-medium">Notes:</span>
                        <p className="mt-1 text-gray-700">
                          {medicalRecord.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : showMedicalForm ? (
                  <form
                    onSubmit={handleSaveMedicalRecord}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Symptoms <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={medicalFormData.symptoms}
                        onChange={(e) =>
                          setMedicalFormData((prev) => ({
                            ...prev,
                            symptoms: e.target.value,
                          }))
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Diagnosis <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={medicalFormData.diagnosis}
                        onChange={(e) =>
                          setMedicalFormData((prev) => ({
                            ...prev,
                            diagnosis: e.target.value,
                          }))
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Prescription
                      </label>
                      <textarea
                        value={medicalFormData.prescription}
                        onChange={(e) =>
                          setMedicalFormData((prev) => ({
                            ...prev,
                            prescription: e.target.value,
                          }))
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Medications, treatments, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Notes
                      </label>
                      <textarea
                        value={medicalFormData.notes}
                        onChange={(e) =>
                          setMedicalFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Follow-up requirements, additional notes..."
                      />
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        type="submit"
                        disabled={savingRecord}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {savingRecord ? "Saving..." : "Save Record"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMedicalForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No medical record yet. Add one to document the appointment.
                  </p>
                )}
              </div>

              {/* Time Status */}
              {!showMedicalForm && selectedAppointment && (
                <div
                  className={`p-3 rounded-md text-sm font-medium ${
                    isAppointmentTimeArrived()
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  {getTimeLeftMessage()}
                </div>
              )}

              {/* Complete Button */}
              {!showMedicalForm && (
                <button
                  onClick={() =>
                    handleCompleteAppointment(selectedAppointment._id)
                  }
                  disabled={!isAppointmentTimeArrived() || !medicalRecord}
                  className={`w-full py-3 rounded-md font-medium transition ${
                    !isAppointmentTimeArrived() || !medicalRecord
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                  title={
                    !medicalRecord
                      ? "Medical record required"
                      : !isAppointmentTimeArrived()
                        ? "Appointment time not reached"
                        : "Click to complete appointment"
                  }
                >
                  {!medicalRecord
                    ? "Add Medical Record to Complete"
                    : "Mark as Completed"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>
                Select an appointment to view details and manage medical records
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
