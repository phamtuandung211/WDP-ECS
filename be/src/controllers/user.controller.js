import {
    changePasswordByAccountId,
    getAccountsForAdmin,
    getProfileByAccountId,
    updateAccountStatusByAdmin,
    updateProfileByAccountId,
} from "../services/user.service.js";

export const getMyProfile = async (req, res) => {
    try {
        const { accountId, role } = req.user;
        const result = await getProfileByAccountId({ accountId, role });
        return res.status(200).json({
            message: "Profile retrieved successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get profile",
        });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const { accountId, role } = req.user;

        const result = await updateProfileByAccountId({
            accountId,
            role,
            payload: req.body,
        });
        return res.status(200).json({
            message: "Profile updated successfully",
            data: result,
        });
    } catch (err) {
        let body;
        try { body = JSON.parse(err.message); } catch { body = { message: err.message || "Failed to update profile" }; }
        return res.status(err.status || 500).json(body);
    }
};

export const changePassword = async (req, res) => {
    try {
        const { accountId } = req.user;
        console.log(req.body);
        
        const {newPassword, oldPassword } = req.body;

        if (typeof newPassword !== "string") {
            return res.status(400).json({ message: "newPassword is required and must be a string" });
        }
        await changePasswordByAccountId({ accountId, oldPassword, newPassword });
        return res.status(200).json({
            message: "Password changed successfully",
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to change password",
        });
    }
};

export const getAccountsForAdminController = async (req, res) => {
    try {
        const { page, limit, status, role, search } = req.query;

        const result = await getAccountsForAdmin({
            page,
            limit,
            status,
            role,
            search,
        });

        return res.status(200).json({
            message: "Accounts retrieved successfully",
            data: result.data,
            metadata: result.metadata,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get accounts",
        });
    }
};

export const updateAccountStatusByAdminController = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "status is required" });
        }

        const result = await updateAccountStatusByAdmin({
            accountId,
            status,
            requesterAccountId: req.user?.accountId,
        });

        return res.status(200).json({
            message: "Account status updated successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to update account status",
        });
    }
};

