import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getMyProfile, updateMyProfile } from "../controllers/profile.controller.js";

const router = express.Router();

// GET /api/profile/me – Lấy profile cá nhân (mọi role)
router.get("/me", authenticate, getMyProfile);

// PUT /api/profile/me – Cập nhật profile cá nhân (mọi role)
router.put("/me", authenticate, updateMyProfile);

export default router;
