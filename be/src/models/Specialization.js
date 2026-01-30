import mongoose from "mongoose";

const specializationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
    },
  },

  { timestamps: true },
);

export default mongoose.model("Specialization", specializationSchema);
