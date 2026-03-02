import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
    createFeedbackController,
    getMyFeedbacksController,
    getFeedbackByAppointmentController,
    getAllFeedbacksController,
    getFeedbackByIdController,
    reviewFeedbackController,
} from "../controllers/feedback.controller.js";

const router = express.Router();

// POST /api/feedbacks – Customer gửi đánh giá cuộc hẹn
router.post(
    "/",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER),
    createFeedbackController,
);

// GET /api/feedbacks/my – Customer xem tất cả đánh giá của mình
router.get(
    "/my",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER),
    getMyFeedbacksController,
);

// GET /api/feedbacks – Staff/Support xem tất cả feedback (có filter, page)
router.get(
    "/",
    authenticate,
    authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT, ROLE_NAME.ADMIN),
    getAllFeedbacksController,
);

// GET /api/feedbacks/appointment/:appointmentId – Lấy feedback theo cuộc hẹn
router.get(
    "/appointment/:appointmentId",
    authenticate,
    authorize(
        ROLE_NAME.CUSTOMER,
        ROLE_NAME.DOCTOR,
        ROLE_NAME.SALE_STAFF,
        ROLE_NAME.CUSTOMER_SUPPORT,
    ),
    getFeedbackByAppointmentController,
);

// GET /api/feedbacks/:id – Xem chi tiết 1 feedback
router.get(
    "/:id",
    authenticate,
    authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT, ROLE_NAME.ADMIN),
    getFeedbackByIdController,
);

// PATCH /api/feedbacks/:id/review – Customer Support đánh dấu đã xem xét
router.patch(
    "/:id/review",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER_SUPPORT),
    reviewFeedbackController,
);

export default router;
