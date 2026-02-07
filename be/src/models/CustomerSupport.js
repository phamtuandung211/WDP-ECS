import mongoose from "mongoose";
import userBaseSchema from "./UserBase.js";

const customerSupportSchema = new mongoose.Schema(
  {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true, _id: true },
);

customerSupportSchema.add(userBaseSchema);

export default mongoose.model("CustomerSupport", customerSupportSchema);
