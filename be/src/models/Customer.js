import mongoose from "mongoose";
import userBaseSchema from "./UserBase.schema.js";
import { RANK } from "../constants/Customer.enum.js";

const customerSchema = new mongoose.Schema(
  {
    rank: { type: String, enum: Object.values(RANK), default: RANK.NORMAL },
  },
  { timestamps: true },
);

customerSchema.add(userBaseSchema);

export default mongoose.model("Customer", customerSchema);
