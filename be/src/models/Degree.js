import mongoose from "mongoose";
import { DEGREE_STATUS } from "../constants/Degree.enum.js";

const degreeSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(DEGREE_STATUS),
      default: DEGREE_STATUS.PENDING,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
    },
    reviewedAt: Date,
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Degree" },
    note: String,
  },

  { timestamps: true },
);

export default mongoose.model("Degree", degreeSchema);
