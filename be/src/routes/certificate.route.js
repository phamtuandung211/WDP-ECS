import express from "express";
import {
    getDoctorCertificates,
    addCertificate,
    getCertificateDetail,
    updateCertificate,
    softDeleteCertificate,
    reviewCertificate,
} from "../controllers/certificate.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import upload from "../utils/multer.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

const router = express.Router();

// Doctor certificate management routes
router.get("/my-certificates", authenticate, authorize(ROLE_NAME.DOCTOR), getDoctorCertificates);
router.post("/add-my-certificates", authenticate, authorize(ROLE_NAME.DOCTOR), upload.single("file"), addCertificate);
router.get("/my-certificates/:certificateId", authenticate, authorize(ROLE_NAME.DOCTOR), getCertificateDetail);
router.put("/my-certificates/:certificateId", authenticate, authorize(ROLE_NAME.DOCTOR), upload.single("file"), updateCertificate);
router.delete("/my-certificates/:certificateId", authenticate, authorize(ROLE_NAME.DOCTOR), softDeleteCertificate);

// Sale staff review route
router.patch("/:certificateId/review", authenticate, authorize(ROLE_NAME.SALE_STAFF), reviewCertificate);

export default router;