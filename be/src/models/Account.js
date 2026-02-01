import mongoose from "mongoose";
import { ACCOUNT_STATUS } from "../constants/Account.enum.js";

const accountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    otpCodeHash: String,
    otpExpiredAt: Date,
    otpAttempts: { type: Number, default: 0, max: 5 },
    otpResendCount: { type: Number, default: 0 },
    otpResendBlockedUntil: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Account", accountSchema);
