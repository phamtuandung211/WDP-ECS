import mongoose from "mongoose";
import { PAYMENT_STATUS, PAYMENT_METHOD } from "../constants/Payment.enum.js";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderCode: { type: Number, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.PAYOS,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    checkoutUrl: { type: String },
    payosTransactionId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ orderCode: 1 }, { unique: true });

export default mongoose.model("Payment", paymentSchema);
