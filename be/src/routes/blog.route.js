import express from "express";
import { list, getById } from "../controllers/manageBlog.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/blogs:
 *   get:
 *     tags:
 *       - Blog (Customer)
 *     summary: Danh sách bài blog (Customer / Guest xem, không cần đăng nhập)
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
 *         description: Tìm theo tiêu đề hoặc nội dung
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", list);

/**
 * @openapi
 * /api/blogs/{id}:
 *   get:
 *     tags:
 *       - Blog (Customer)
 *     summary: Chi tiết bài blog (Customer / Guest)
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
 *               $ref: "#/components/schemas/Blog"
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", getById);

export default router;
