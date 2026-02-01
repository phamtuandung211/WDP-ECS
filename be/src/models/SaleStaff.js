import mongoose from "mongoose";
import userBaseSchema from "./UserBase.js";

const saleStaffSchema = new mongoose.Schema(
  {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true, _id: true },
);

saleStaffSchema.add(userBaseSchema);

export default mongoose.model("SaleStaff", saleStaffSchema);
