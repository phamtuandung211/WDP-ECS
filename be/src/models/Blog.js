import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleStaff",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Blog", blogSchema);
