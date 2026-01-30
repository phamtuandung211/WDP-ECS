import mongoose from "mongoose";
import userBaseSchema from "./UserBase.schema.js";

const customerSupportSchema = new mongoose.Schema(
  {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
);

customerSupportSchema.add(userBaseSchema);

export default mongoose.model("CustomerSupport", customerSupportSchema);
