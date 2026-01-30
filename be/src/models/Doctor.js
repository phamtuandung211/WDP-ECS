import mongoose from "mongoose";
import userBaseSchema from "./UserBase.schema.js";

const doctorSchema = new mongoose.Schema(
  {
    specializations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Specialization" },
    ],
    experienceYears: { type: Number, default: 0 },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerSupport",
    },
  },
  { timestamps: true },
);

saleStaffSchema.add(userBaseSchema);

export default mongoose.model("SaleStaff", saleStaffSchema);
