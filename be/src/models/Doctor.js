import mongoose from "mongoose";
import userBaseSchema from "./UserBase.js";

const doctorSchema = new mongoose.Schema(
  {
    img: { type: String },
    specializations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Specialization" },
    ],
    experienceYears: { type: Number, default: 1 },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true, _id: true },
);

doctorSchema.add(userBaseSchema);

export default mongoose.model("Doctor", doctorSchema);
