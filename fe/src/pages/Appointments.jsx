import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loading, Alert } from "../components/UI";
import { appointments as mockAppointments } from "../mockData";

export function Appointments() {
  const { user } = useAuth();
  const [appointments] = useState(mockAppointments);
  const [loading] = useState(false);
  const [error] = useState(null);

  if (!user) {
    return <Alert type="warning">Please log in to view appointments</Alert>;
  }

  // using static data, no loading or error states

  return (
    <div className="page appointments-page">
      <h2>My Appointments</h2>
      {appointments.length === 0 ? (
        <p>
          No appointments yet. <a href="/services">Book one now</a>
        </p>
      ) : (
        <div className="appointments-list grid gap-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="border p-4 rounded bg-white">
              <h3 className="font-semibold">{apt.serviceName}</h3>
              <p>Date: {apt.date}</p>
              <p>Time: {apt.time}</p>
              <p>Status: {apt.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
