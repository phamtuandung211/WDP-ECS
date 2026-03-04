import {
    getProfileByAccountId,
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

