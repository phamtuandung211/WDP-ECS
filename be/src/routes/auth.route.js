import express from "express";
import {
  register,
  verifyOtpController,
  resendOtpController,
  login,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", resendOtpController);
router.post("/login", login);

export default router;
