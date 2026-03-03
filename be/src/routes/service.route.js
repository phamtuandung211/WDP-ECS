import express from "express";
import { list, getById } from "../controllers/manageService.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", list);
router.get("/:id", getById);

export default router;
