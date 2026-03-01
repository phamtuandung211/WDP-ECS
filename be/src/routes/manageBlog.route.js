import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  list,
  getById,
  create,
  update,
  remove,
} from "../controllers/manageBlog.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/manage-blogs:
 *   get:
 *     tags:
 *       - Manage Blog (Sale Staff)
 *     summary: Danh sách bài blog (Sale Staff quản lý)
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
 * /api/manage-blogs/{id}:
 *   get:
 *     tags:
 *       - Manage Blog (Sale Staff)
 *     summary: Chi tiết bài blog (Sale Staff)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: "string" }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Không tìm thấy
 */
router.get("/:id", getById);

/**
 * @openapi
 * /api/manage-blogs:
 *   post:
 *     tags:
 *       - Manage Blog (Sale Staff)
 *     summary: Tạo bài blog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BlogCreate"
 *     responses:
 *       201:
 *         description: Đã tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Blog"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Chỉ Sale Staff
 */
router.post("/", authenticate, authorize(ROLE_NAME.SALE_STAFF), create);

/**
 * @openapi
 * /api/manage-blogs/{id}:
 *   put:
 *     tags:
 *       - Manage Blog (Sale Staff)
 *     summary: Cập nhật bài blog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: "string" }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: "string" }
 *               content: { type: "string" }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Blog"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Chỉ Sale Staff
 *       404:
 *         description: Không tìm thấy
 */
router.put("/:id", authenticate, authorize(ROLE_NAME.SALE_STAFF), update);

/**
 * @openapi
 * /api/manage-blogs/{id}:
 *   delete:
 *     tags:
 *       - Manage Blog (Sale Staff)
 *     summary: Xóa bài blog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: "string" }
 *     responses:
 *       200:
 *         description: Đã xóa
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Chỉ Sale Staff
 *       404:
 *         description: Không tìm thấy
 */
router.delete("/:id", authenticate, authorize(ROLE_NAME.SALE_STAFF), remove);

export default router;
