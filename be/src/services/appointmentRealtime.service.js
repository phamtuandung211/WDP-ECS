import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import { APPOINTMENT_STATUS } from "../constants/Appointment.enum.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

function toAssignedPayload(appointment) {
  const slot = appointment.slotId;

  return {
    appointmentId: appointment._id.toString(),
    desiredDate: appointment.desiredDate || slot?.startTime || null,
    slotId: slot?._id?.toString?.() || appointment.slotId?.toString?.() || null,
    type: appointment.type,
    slot: {
      startTime: slot?.startTime || null,
      endTime: slot?.endTime || null,
    },
    eventKey: `${appointment._id.toString()}:${appointment.status}:${new Date(
      appointment.updatedAt || appointment.createdAt,
    ).getTime()}`,
  };
}

export async function emitAppointmentWaitingAssign(io, appointment) {
  if (!io || !appointment) return;

  io.to("sale_staff:all").emit("appointment_waiting_assign", {
    appointmentId: appointment._id.toString(),
    customerId: appointment.customerId?.toString?.() || appointment.customerId,
    desiredDate: appointment.desiredDate || null,
    type: appointment.type,
    eventKey: `${appointment._id.toString()}:${appointment.status}:${new Date(
      appointment.updatedAt || appointment.createdAt,
    ).getTime()}`,
  });
}

export async function emitAppointmentAssigned(io, appointment) {
  if (!io || !appointment) return;

  const populated = await Appointment.findById(appointment._id)
    .populate("slotId", "startTime endTime")
    .lean();

  if (!populated) return;

  const payload = toAssignedPayload(populated);

  if (populated.customerId) {
    io.to(`user:${populated.customerId.toString()}`).emit(
      "appointment_assigned",
      payload,
    );
  }

  if (populated.doctorId) {
    io.to(`user:${populated.doctorId.toString()}`).emit(
      "appointment_assigned",
      payload,
    );
  }
}

export async function replayNotificationsForSocket(socket) {
  const role = socket.user?.role;
  const profileId = socket.profileId;

  if (!role || !profileId) return;

  if (role === ROLE_NAME.SALE_STAFF) {
    const waiting = await Appointment.find({
      status: APPOINTMENT_STATUS.WAITING_ASSIGN,
    })
      .select("_id customerId desiredDate type status updatedAt createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    waiting.forEach((appointment) => {
      socket.emit("appointment_waiting_assign", {
        appointmentId: appointment._id.toString(),
        customerId:
          appointment.customerId?.toString?.() || appointment.customerId,
        desiredDate: appointment.desiredDate || null,
        type: appointment.type,
        replay: true,
        eventKey: `${appointment._id.toString()}:${appointment.status}:${new Date(
          appointment.updatedAt || appointment.createdAt,
        ).getTime()}`,
      });
    });

    return;
  }

  if (role === ROLE_NAME.CUSTOMER || role === ROLE_NAME.DOCTOR) {
    const query = {
      status: APPOINTMENT_STATUS.CONFIRMED,
    };

    if (role === ROLE_NAME.CUSTOMER) {
      query.customerId = profileId;
    }

    if (role === ROLE_NAME.DOCTOR) {
      query.doctorId = profileId;
    }

    const assigned = await Appointment.find(query)
      .populate("slotId", "startTime endTime")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    assigned.forEach((appointment) => {
      socket.emit("appointment_assigned", {
        ...toAssignedPayload(appointment),
        replay: true,
      });
    });
  }
}

export async function enrichAppointmentWithSlot(appointmentLike) {
  if (!appointmentLike?.slotId) return { slot: null };

  if (
    typeof appointmentLike.slotId === "object" &&
    appointmentLike.slotId.startTime &&
    appointmentLike.slotId.endTime
  ) {
    return {
      slot: {
        startTime: appointmentLike.slotId.startTime,
        endTime: appointmentLike.slotId.endTime,
      },
    };
  }

  const slot = await Slot.findById(appointmentLike.slotId)
    .select("startTime endTime")
    .lean();

  return {
    slot: slot
      ? {
          startTime: slot.startTime,
          endTime: slot.endTime,
        }
      : null,
  };
}
