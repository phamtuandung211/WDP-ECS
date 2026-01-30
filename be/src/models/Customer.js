import mongoose from "mongoose";
import userBaseSchema from "./UserBase.js";
import { ACCOUNT_ROLE, ACCOUNT_STATUS } from "../constants/Account.enum";
const userBase = userBaseSchema.obj;
const saleStaffSchema = new mongoose.Schema(
  {
    ...userBase,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

export default mongoose.model("SaleStaff", saleStaffSchema);
