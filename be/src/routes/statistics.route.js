import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
    getOverviewStatsController,
    getRevenueStatsController,
    getAppointmentStatsController,
    getDoctorStatsController,
    getFeedbackStatsController,
    getAccountStatsController,
} from "../controllers/statistics.controller.js";

const router = express.Router();

// Tất cả statistics routes chỉ dành cho ADMIN
router.use(authenticate, authorize(ROLE_NAME.ADMIN));

/**
 * GET /api/statistics/overview
 * Tổng quan: tổng tài khoản, cuộc hẹn, doanh thu, rating trung bình
 * Query: from, to (YYYY-MM-DD)
 */
router.get("/overview", getOverviewStatsController);

/**
 * GET /api/statistics/revenue
 * Doanh thu theo từng kỳ
 * Query: from, to, groupBy (day | month, default: month)
 */
router.get("/revenue", getRevenueStatsController);

/**
 * GET /api/statistics/appointments
 * Số cuộc hẹn theo kỳ, chia theo status và type
 * Query: from, to, groupBy (day | month, default: month)
 */
router.get("/appointments", getAppointmentStatsController);

/**
 * GET /api/statistics/doctors
 * Xếp hạng bác sĩ theo số cuộc hẹn (có phân trang)
 * Query: from, to, page, limit
 */
router.get("/doctors", getDoctorStatsController);

/**
 * GET /api/statistics/feedbacks
 * Phân bổ rating 1-5 sao, avg rating, số feedback chưa review
 * Query: from, to
 */
router.get("/feedbacks", getFeedbackStatsController);

/**
 * GET /api/statistics/accounts
 * Tài khoản mới đăng ký theo kỳ, chia theo role
 * Query: from, to, groupBy (day | month, default: month)
 */
router.get("/accounts", getAccountStatsController);

export default router;
