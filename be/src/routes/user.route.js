import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  changePassword,
  getAccountsForAdminController,
  getMyProfile,
  updateAccountStatusByAdminController,
  updateMyProfile,
} from "../controllers/user.controller.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);

router.patch("/me", authenticate, updateMyProfile);

router.post("/change-password", authenticate, changePassword);

router.get(
  "/admin/accounts",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  getAccountsForAdminController,
);

router.patch(
  "/admin/accounts/:accountId/status",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  updateAccountStatusByAdminController,
);

export default router;
