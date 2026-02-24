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

/**
 * @openapi
 * /api/services/{id}:
 *   get:
 *     tags:
 *       - Service (Customer)
 *     summary: Chi tiết gói dịch vụ (Service Detail - Customer / Guest)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: "string" }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Service"
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", getById);

export default router;
