import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  createAppointment,
  cancelAppointmentController,
  getMyAppointments,
  approveBasicAppointmentController,
  getAppointmentByIdController,
  getAllAppointmentsForStaffController,
} from "../controllers/appointment.controller.js";

const router = express.Router();

// POST /api/appointments – Create a new appointment (Customer only)
router.post(
  "/",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  createAppointment,
);

// POST /api/appointments/:id/approve – Approve a basic appointment (Staff only)
router.post(
  "/:id/approve",
  authenticate,
  authorize(ROLE_NAME.SALE_STAFF),
  approveBasicAppointmentController,
);

// GET /api/appointments/staff – Get all appointments (Sale Staff)
router.get(
  "/staff",
  authenticate,
  authorize(ROLE_NAME.SALE_STAFF, ROLE_NAME.DOCTOR),
  getAllAppointmentsForStaffController,
);

// GET /api/appointments – Get my appointments (Customer only)
router.get("/", authenticate, authorize(ROLE_NAME.CUSTOMER), getMyAppointments); //Done

// GET /api/appointments/:id – Get appointment by id (Customer, Sale Staff, Doctor)
router.get(
  "/:id",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER, ROLE_NAME.SALE_STAFF, ROLE_NAME.DOCTOR),
  getAppointmentByIdController,
);

// POST /api/appointments/:id/cancel – Cancel an appointment
router.post(
  "/:id/cancel",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  cancelAppointmentController,
);

export default router;
