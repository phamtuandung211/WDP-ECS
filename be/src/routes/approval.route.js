import express from "express";
import {
  resubmitForApprovalController,
  updateProfileAfterRejectionController,
  getAdminPendingStaff,
  getCustomerSupportPendingDoctors,
  approvePendingStaff,
  rejectPendingStaff,
  approvePendingDoctor,
  rejectPendingDoctor,
} from "../controllers/approval.controller.js";
import {
  authenticate,
  authorize,
  blockRejectedAccount,
} from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

const router = express.Router();

router.get(
  "/admin/accounts",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  getAdminPendingStaff,
);

router.patch(
  "/admin/accounts/:accountId/approve",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  approvePendingStaff,
);

router.patch(
  "/admin/accounts/:accountId/reject",
  authenticate,
  authorize(ROLE_NAME.ADMIN),
  rejectPendingStaff,
);

router.get(
  "/customer-support/accounts",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER_SUPPORT),
  blockRejectedAccount,
  getCustomerSupportPendingDoctors,
);

router.patch(
  "/customer-support/accounts/:accountId/approve",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER_SUPPORT),
  blockRejectedAccount,
  approvePendingDoctor,
);

router.patch(
  "/customer-support/accounts/:accountId/reject",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER_SUPPORT),
  blockRejectedAccount,
  rejectPendingDoctor,
);

router.put(
  "/accounts/me/profile",
  authenticate,
  updateProfileAfterRejectionController,
);
router.post(
  "/accounts/me/resubmit",
  authenticate,
  resubmitForApprovalController,
);

export default router;
