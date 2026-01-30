import mongoose from "mongoose";
import { ACCOUNT_ROLE, ACCOUNT_STATUS } from "../constants/Account.enum";

const accountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: ACCOUNT_ROLE,
      enum: Object.values(ACCOUNT_ROLE),
      default: ACCOUNT_ROLE.CUSTOMER,
    },
    status: {
      type: ACCOUNT_STATUS,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    otpCodeHash: String,
    otpExpiredAt: Date,
    otpAttempts: { type: Number, default: 0, max: 5 },
    otpResendCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Account", accountSchema);
