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

        // Nếu có file upload từ multer → gán URL Cloudinary vào body
        if (req.file) {
            req.body.avatar = req.file.path;
        }

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
        // Lỗi từ multer (file type, size) trả về 400
        if (err.message?.includes("Chỉ chấp nhận")) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(err.status || 500).json({
            message: err.message || "Failed to update profile",
        });
    }
};
