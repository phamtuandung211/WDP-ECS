import mongoose from "mongoose";
import { SLOT_STATUS, SLOT_TYPE } from "../constants/Slot.enum.js";
const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxPatients: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    type: {
      type: String,
      enum: Object.values(SLOT_TYPE),
      default: SLOT_TYPE.BASIC,
    },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.AVAILABLE,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Slot", slotSchema);
