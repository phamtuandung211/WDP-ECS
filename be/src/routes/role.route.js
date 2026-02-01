import express from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

const router = express.Router();

router.get("/", authenticate, authorize(ROLE_NAME.ADMIN), getAllRoles);
router.get("/:id", getRoleById);
router.post("/", authenticate, authorize(ROLE_NAME.ADMIN), createRole);
router.put("/:id", authenticate, authorize(ROLE_NAME.ADMIN), updateRole);
router.delete("/:id", authenticate, authorize(ROLE_NAME.ADMIN), deleteRole);

export default router;
