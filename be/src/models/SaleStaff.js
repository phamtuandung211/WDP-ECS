import mongoose from "mongoose";
import userBaseSchema from "./UserBase.js";
const userBase = userBaseSchema.obj;
const saleStaffSchema = new mongoose.Schema(
  {
    ...userBase,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);
saleStaffSchema.add(userBaseSchema);

export default mongoose.model("SaleStaff", saleStaffSchema);
