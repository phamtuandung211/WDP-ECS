import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
    createMedicalRecordController,
    getMyMedicalRecordsController,
    getMedicalRecordByIdController,
    getMedicalRecordByAppointmentController,
    updateMedicalRecordController,
    getAllMedicalRecordsController,
} from "../controllers/medicalRecord.controller.js";

const router = express.Router();

// POST /api/medical-records – Doctor tạo hồ sơ bệnh án
router.post(
    "/",
    authenticate,
    authorize(ROLE_NAME.DOCTOR),
    createMedicalRecordController,
);

// GET /api/medical-records/my – Customer xem lịch sử bệnh án của mình
router.get(
    "/my",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER),
    getMyMedicalRecordsController,
);

// GET /api/medical-records – Staff xem toàn bộ hồ sơ (có filter)
router.get(
    "/",
    authenticate,
    authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT, ROLE_NAME.ADMIN),
    getAllMedicalRecordsController,
);

// GET /api/medical-records/appointment/:appointmentId – Lấy hồ sơ theo cuộc hẹn
router.get(
    "/appointment/:appointmentId",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER, ROLE_NAME.DOCTOR, ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT),
    getMedicalRecordByAppointmentController,
);

// GET /api/medical-records/:id – Xem chi tiết 1 hồ sơ
router.get(
    "/:id",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER, ROLE_NAME.DOCTOR, ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT),
    getMedicalRecordByIdController,
);

// PUT /api/medical-records/:id – Doctor cập nhật hồ sơ bệnh án
router.put(
    "/:id",
    authenticate,
    authorize(ROLE_NAME.DOCTOR),
    updateMedicalRecordController,
);

export default router;
