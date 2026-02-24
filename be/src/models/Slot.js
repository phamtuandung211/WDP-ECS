import mongoose from "mongoose";
import { SLOT_STATUS } from "../constants/Slot.enum.js";
const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxPatients: { type: Number, required: true, min: 1, max: 3 },
    bookedCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.AVAILABLE,
    },
    isExclusive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

slotSchema.index({ doctorId: 1, startTime: 1, endTime: 1 }, { unique: true });

export default mongoose.model("Slot", slotSchema);
