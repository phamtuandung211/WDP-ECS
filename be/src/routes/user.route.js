import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getMyProfile, updateMyProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);

router.patch("/me", authenticate, updateMyProfile);

export default router;
