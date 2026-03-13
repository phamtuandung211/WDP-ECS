import express from 'express';
import {
    getAllDoctors,
    getDoctorById,
    getRelateDoctors,
    getDoctorProfile,
    updateDoctorProfile
} from '../controllers/doctor.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import upload from '../utils/multer.js';
import { ROLE_NAME } from '../constants/Role.enum.js';

const route = express.Router();

// Doctor profile routes (must be before /:id to avoid conflict)
route.get("/profile/me", authenticate, authorize(ROLE_NAME.DOCTOR), getDoctorProfile);
route.put("/profile/me", authenticate, authorize(ROLE_NAME.DOCTOR), upload.single("file"), updateDoctorProfile);

route.get("/", getAllDoctors);
route.get("/:id", getDoctorById);
route.get("/:id/related", getRelateDoctors);


export default route;