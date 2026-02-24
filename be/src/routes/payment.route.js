import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  createPayment,
  payosWebhook,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/payos/create",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  createPayment,
);

// POST /api/payments/payos/webhook – PayOS webhook callback (NO auth – signature verified internally)
router.post("/payos/webhook", payosWebhook);

export default router;
