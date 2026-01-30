import mongoose from "mongoose";
import { ROLE_NAME } from "../constants/Role.enum.js";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: Object.values(ROLE_NAME),
    },
  },
  { timestamps: true },
);

export default mongoose.model("Role", roleSchema);
