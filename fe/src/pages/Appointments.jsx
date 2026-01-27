import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { appointmentService } from "../services";
import { Loading, Alert } from "../components/UI";

export function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentService.getAll();
        setAppointments(data);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  if (!user) {
    return <Alert type="warning">Please log in to view appointments</Alert>;
  }

  if (loading) return <Loading />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="page appointments-page">
      <h2>My Appointments</h2>
      {appointments.length === 0 ? (
        <p>
          No appointments yet. <a href="/services">Book one now</a>
        </p>
      ) : (
        <div className="appointments-list">
          {appointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <h3>{apt.serviceName}</h3>
              <p>Date: {new Date(apt.date).toLocaleDateString()}</p>
              <p>Time: {apt.time}</p>
              <p>Status: {apt.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
