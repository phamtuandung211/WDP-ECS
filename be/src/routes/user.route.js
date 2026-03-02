import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { getMyProfile, updateMyProfile } from "../controllers/user.controller.js";

const router = express.Router();

// GET /api/user/me – Lấy profile cá nhân (mọi role)
router.get("/me", authenticate, getMyProfile);

// PUT /api/user/me – Cập nhật profile cá nhân (mọi role), hỗ trợ upload avatar
router.put("/me", authenticate, uploadAvatar, updateMyProfile);

export default router;
