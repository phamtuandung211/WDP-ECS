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

router.get("/", async (req, res) => {
  await getAllRoles(req, res);
});

router.get("/:id", async (req, res) => {
  await getRoleById(req, res);
});

router.post("/", authenticate, authorize(ROLE_NAME.ADMIN), async (req, res) => {
  await createRole(req, res);
});

router.post("/", async (req, res) => {
  await createRole(req, res);
});

router.put(
  "/:id",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  async (req, res) => {
    await updateRole(req, res);
  },
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  async (req, res) => {
    await deleteRole(req, res);
  },
);

export default router;
