import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  list,
  getById,
  create,
  update,
  remove,
} from "../controllers/manageService.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/manage-services:
 *   get:
 *     tags:
 *       - Manage Service
 *     summary: Danh sách gói dịch vụ
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
 * /api/manage-services/{id}:
 *   get:
 *     tags:
 *       - Manage Service
 *     summary: Chi tiết gói dịch vụ
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
 * /api/manage-services:
 *   post:
 *     tags:
 *       - Manage Service
 *     summary: Tạo gói dịch vụ
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ServiceCreate"
 *     responses:
 *       201:
 *         description: Đã tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Service"
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
 * /api/manage-services/{id}:
 *   put:
 *     tags:
 *       - Manage Service
 *     summary: Cập nhật gói dịch vụ
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
 *               name: { type: "string" }
 *               description: { type: "string" }
 *               price: { type: "number", minimum: 0 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Service"
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
 * /api/manage-services/{id}:
 *   delete:
 *     tags:
 *       - Manage Service
 *     summary: Xóa gói dịch vụ
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
