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

router.post(
    "/",
    authenticate,
    authorize(ROLE_NAME.DOCTOR),
    createMedicalRecordController,
);

router.get(
    "/my",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER),
    getMyMedicalRecordsController,
);

router.get(
    "/",
    authenticate,
    authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT, ROLE_NAME.ADMIN),
    getAllMedicalRecordsController,
);

router.get(
    "/appointment/:appointmentId",
    authenticate,
    authorize(ROLE_NAME.CUSTOMER, ROLE_NAME.DOCTOR, ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT),
    getMedicalRecordByAppointmentController,
);

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
