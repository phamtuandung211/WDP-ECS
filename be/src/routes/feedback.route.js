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

router.post(
    "/",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER),
    createFeedbackController,
);

router.get(
    "/my",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER),
    getMyFeedbacksController,
);

router.get(
    "/",
    authenticate,
    authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT, ROLE_NAME.ADMIN),
    getAllFeedbacksController,
);

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

router.get(
    "/:id",
    authenticate,
    authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT, ROLE_NAME.ADMIN),
    getFeedbackByIdController,
);

router.patch(
    "/:id/review",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER_SUPPORT),
    reviewFeedbackController,
);

export default router;
