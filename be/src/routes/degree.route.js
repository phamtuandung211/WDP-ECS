// routes/degree.route.js
import express from "express";
import {
    getAllDegreeNames,
    getDoctorDegrees,
    addDegree,
    getDegreeDetail,
    updateDegree,
    softDeleteDegree,
    reviewDegree,
    getAllDegreesForStaff,
} from "../controllers/degree.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import upload from "../utils/multer.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

const router = express.Router();

router.get("/names", getAllDegreeNames);

// Staff: get all degrees for review
router.get("/", authenticate, authorize(ROLE_NAME.SALE_STAFF), getAllDegreesForStaff);

// Doctor degree management routes
router.get("/my-degrees", authenticate, authorize(ROLE_NAME.DOCTOR), getDoctorDegrees);
router.post("/add-my-degrees", authenticate, authorize(ROLE_NAME.DOCTOR), upload.single("file"), addDegree);
router.get("/my-degrees/:degreeId", authenticate, authorize(ROLE_NAME.DOCTOR), getDegreeDetail);
router.put("/my-degrees/:degreeId", authenticate, authorize(ROLE_NAME.DOCTOR), upload.single("file"), updateDegree);
router.delete("/my-degrees/:degreeId", authenticate, authorize(ROLE_NAME.DOCTOR), softDeleteDegree);

// Sale staff review route
router.patch("/:degreeId/review", authenticate, authorize(ROLE_NAME.SALE_STAFF), reviewDegree);

export default router;