import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Service", serviceSchema);
