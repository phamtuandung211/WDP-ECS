// routes/degree.route.js
import express from "express";
import { getAllDegreeNames } from "../controllers/degree.controller.js";

const router = express.Router();

router.get("/names", getAllDegreeNames);

export default router;