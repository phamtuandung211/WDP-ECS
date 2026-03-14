import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import { APPOINTMENT_STATUS } from "../constants/Appointment.enum.js";
import { getIO } from "../config/socket.js";
import {
  emitAppointmentWaitingAssign,
  emitAppointmentAssigned,
} from "./appointmentRealtime.service.js";

let changeStream = null;

/**
 * Start watching Appointment collection via MongoDB Change Streams.
 * When status changes to WAITING_ASSIGN or CONFIRMED (e.g. from PayOS webhook on another server),
 * emit socket events to connected clients.
 * Requires MongoDB Atlas (replica set). Safe to run on both local and deployed backends.
 */
export async function startAppointmentChangeStreamWatcher() {
  if (changeStream) return;

  const conn = mongoose.connection;
  if (conn.readyState !== 1) {
    await new Promise((resolve) => {
      if (conn.readyState === 1) return resolve();
      conn.once("connected", resolve);
    });
  }

  try {
    const appointmentsCollection = conn.collection("appointments");
    changeStream = appointmentsCollection.watch(
      [
        {
          $match: {
            $or: [
              { "updateDescription.updatedFields.status": APPOINTMENT_STATUS.WAITING_ASSIGN },
              { "updateDescription.updatedFields.status": APPOINTMENT_STATUS.CONFIRMED },
            ],
          },
        },
      ],
      { fullDocument: "updateLookup" },
    );

    changeStream.on("change", async (change) => {
      if (change.operationType !== "update") return;

      const doc = change.fullDocument;
      if (!doc || !doc.status) return;

      try {
        const io = getIO();
        const appointment = {
          _id: doc._id,
          customerId: doc.customerId,
          doctorId: doc.doctorId,
          desiredDate: doc.desiredDate,
          type: doc.type,
          status: doc.status,
          slotId: doc.slotId,
          updatedAt: doc.updatedAt,
          createdAt: doc.createdAt,
        };

        if (doc.status === APPOINTMENT_STATUS.WAITING_ASSIGN) {
          await emitAppointmentWaitingAssign(io, appointment);
          console.log(
            "[ChangeStream] Emitted appointment_waiting_assign for",
            doc._id?.toString?.(),
          );
        } else if (doc.status === APPOINTMENT_STATUS.CONFIRMED) {
          const populated = await Appointment.findById(doc._id)
            .populate("slotId", "startTime endTime")
            .lean();
          if (populated) {
            await emitAppointmentAssigned(io, populated);
            console.log(
              "[ChangeStream] Emitted appointment_assigned for",
              doc._id?.toString?.(),
            );
          }
        }
      } catch (err) {
        console.warn("[ChangeStream] Emit failed:", err?.message || err);
      }
    });

    changeStream.on("error", (err) => {
      console.warn("[ChangeStream] Watcher error:", err?.message || err);
      changeStream = null;
    });

    changeStream.on("close", () => {
      changeStream = null;
      console.log("[ChangeStream] Watcher closed");
    });

    console.log("✓ Appointment Change Stream watcher started");
  } catch (err) {
    console.warn(
      "[ChangeStream] Failed to start watcher (replica set required):",
      err?.message || err,
    );
  }
}

export function stopAppointmentChangeStreamWatcher() {
  if (changeStream) {
    changeStream.close().catch(() => {});
    changeStream = null;
  }
}
