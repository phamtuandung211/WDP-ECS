import express from "express";
import upload from "../utils/multer.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadImage);

export default router;
