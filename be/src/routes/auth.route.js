import express from "express";
import {
  register,
  verifyOtpController,
  resendOtpController,
  login,
  registerStaff,
  googleAuth,
} from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

const router = express.Router();

//Register Staff
router.post(
  "/register-staff",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  registerStaff,
);

// Register Customer
router.post("/register", register);

// OTP and login
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", resendOtpController);
router.post("/login", login);

// Google OAuth (Customer only)
router.post("/google", googleAuth);

export default router;
