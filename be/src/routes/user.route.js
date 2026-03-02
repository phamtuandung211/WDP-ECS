import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { getMyProfile, updateMyProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);

router.put("/me", authenticate, uploadAvatar, updateMyProfile);

export default router;
