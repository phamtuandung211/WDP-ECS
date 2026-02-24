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
      required: true,
    },
    desiredDate: { type: Date },
    type: {
      type: String,
      enum: Object.values(APPOINTMENT_TYPE),
      required: true,
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
      default: APPOINTMENT_STATUS.PENDING_PAYMENT,
    },
    note: { type: String },
    paymentExpireAt: { type: Date },
    paymentOrderCode: { type: Number, unique: true, sparse: true },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
      default: null,
    },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound indexes for query performance
appointmentSchema.index({ customerId: 1, status: 1 });
appointmentSchema.index({ slotId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, desiredDate: 1 });
appointmentSchema.index({ status: 1, paymentExpireAt: 1 }); // cron auto-cancel
appointmentSchema.index({ paymentOrderCode: 1 });

export default mongoose.model("Appointment", appointmentSchema);
