import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getSlots } from "../controllers/slot.controller.js";

const router = express.Router();

router.get("/", authenticate, getSlots);

export default router;
