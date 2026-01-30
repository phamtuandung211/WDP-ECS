import mongoose from "mongoose";
import { CERTIFICATE_STATUS } from "../constants/Certificate.enum";

const certificateSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    name: { type: String, required: true },
    issuedBy: { type: String, required: true },
    issueDate: { type: Date, required: true },
    fileUrl: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(CERTIFICATE_STATUS),
      default: CERTIFICATE_STATUS.PENDING,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
    },
    reviewedAt: Date,
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
    note: String,
  },

  { timestamps: true },
);

export default mongoose.model("Certificate", certificateSchema);
