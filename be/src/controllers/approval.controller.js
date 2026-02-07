import {
  resubmitForApproval,
  updateProfileAfterRejection,
  getPendingAccountsByFilter,
  approveAccount,
  rejectAccount,
} from "../services/auth.service.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

export const getAdminPendingStaff = async (req, res) => {
  try {
    const { role, status, page, limit } = req.query;

    let roles = [ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT];
    if (role) {
      roles = role.split(",").map((r) => r.trim());
    }

    const result = await getPendingAccountsByFilter({
      roles,
      status: status || "PENDING",
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get pending staff accounts",
      errors: err.data,
    });
  }
};

export const getCustomerSupportPendingDoctors = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const roles = [ROLE_NAME.DOCTOR];

    const result = await getPendingAccountsByFilter({
      roles,
      status: status || "PENDING",
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get pending doctor accounts",
      errors: err.data,
    });
  }
};

export const approvePendingStaff = async (req, res) => {
  try {
    const { accountId } = req.params;

    await approveAccount({
      accountId,
      actorId: req.user.accountId,
      actorRole: ROLE_NAME.ADMIN,
    });

    return res.status(200).json({
      message: "Account approved successfully",
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to approve account",
    });
  }
};

export const approvePendingDoctor = async (req, res) => {
  try {
    const { accountId } = req.params;

    await approveAccount({
      accountId,
      actorId: req.user.accountId,
      actorRole: ROLE_NAME.CUSTOMER_SUPPORT,
    });

    return res.status(200).json({
      message: "Account approved successfully",
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to approve account",
    });
  }
};

export const rejectPendingStaff = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { rejectionReason } = req.body;

    const result = await rejectAccount({
      accountId,
      actorId: req.user.accountId,
      actorRole: ROLE_NAME.ADMIN,
      rejectionReason,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to reject PendingStaff",
      errors: err.data,
    });
  }
};

export const rejectPendingDoctor = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { rejectionReason } = req.body;

    const result = await rejectAccount({
      accountId,
      actorId: req.user.accountId,
      actorRole: ROLE_NAME.CUSTOMER_SUPPORT,
      rejectionReason,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to reject PendingDoctor",
      errors: err.data,
    });
  }
};

export const updateProfileAfterRejectionController = async (req, res) => {
  try {
    const result = await updateProfileAfterRejection({
      accountId: req.user?.accountId,
      payload: req.body,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to update profile",
      errors: err.data,
    });
  }
};

export const resubmitForApprovalController = async (req, res) => {
  try {
    const accountId = req.user?.accountId;

    const result = await resubmitForApproval({ accountId });

    return res.status(200).json({
      message: "Resubmitted for approval successfully",
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to resubmit for approval",
      errors: err.data,
    });
  }
};
