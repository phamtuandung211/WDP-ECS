import mongoose from "mongoose";
import {
  APPOINTMENT_TYPE,
  APPOINTMENT_STATUS,
} from "../constants/Appointment.enum.js";

const appointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    desiredDate: { type: Date, required: true },
    type: {
      type: String,
      enum: Object.values(APPOINTMENT_TYPE),
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Appointment", appointmentSchema);
