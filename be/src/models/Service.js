import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    duration: Number, // minutes
    category: String,
    image: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Service", serviceSchema);
