import express from "express";
import { list, getById } from "../controllers/manageService.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/services:
 *   get:
 *     tags:
 *       - Service (Customer)
 *     summary: Danh sách gói dịch vụ (Customer / Guest xem)
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: "integer", default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: "integer", default: 10 }
 *       - name: search
 *         in: query
 *         schema: { type: "string" }
 *         description: Tìm theo tên hoặc mô tả
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", list);

export default router;
