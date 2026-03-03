import express from "express";
import { list, getById } from "../controllers/manageService.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, list);
router.get("/:id", authenticate, getById);

export default router;
