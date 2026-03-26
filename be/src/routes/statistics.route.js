import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  getOverviewStatsController,
  getRevenueStatsController,
  getAppointmentStatsController,
  getDoctorStatsController,
  getCustomerStatsController,
  getFeedbackStatsController,
  getAccountStatsController,
} from "../controllers/statistics.controller.js";

const router = express.Router();

router.use(authenticate, authorize(ROLE_NAME.ADMIN));

router.get("/overview", getOverviewStatsController);

router.get("/revenue", getRevenueStatsController);

router.get("/appointments", getAppointmentStatsController);

router.get("/doctors", getDoctorStatsController);

router.get("/customers", getCustomerStatsController);

router.get("/feedbacks", getFeedbackStatsController);

router.get("/accounts", getAccountStatsController);

export default router;
