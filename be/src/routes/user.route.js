import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { changePassword, getMyProfile, updateMyProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);

router.patch("/me", authenticate, updateMyProfile);

router.post("/change-password", authenticate, changePassword);
export default router;
