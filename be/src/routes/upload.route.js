import express from "express";
import upload from "../utils/multer.js";
import { uploadImage } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", upload.single("file"), authenticate, uploadImage);

export default router;
