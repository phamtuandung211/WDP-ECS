import {
    getOverviewStats,
    getRevenueStats,
    getAppointmentStats,
    getDoctorStats,
    getFeedbackStats,
    getAccountStats,
} from "../services/statistics.service.js";

export const getOverviewStatsController = async (req, res) => {
    try {
        const { from, to } = req.query;
        const result = await getOverviewStats({ from, to });
        return res.status(200).json({
            message: "Overview statistics retrieved successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get overview statistics",
        });
    }
};

export const getRevenueStatsController = async (req, res) => {
    try {
        const { from, to, groupBy } = req.query;
        const result = await getRevenueStats({ from, to, groupBy });
        return res.status(200).json({
            message: "Revenue statistics retrieved successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get revenue statistics",
        });
    }
};

export const getAppointmentStatsController = async (req, res) => {
    try {
        const { from, to, groupBy } = req.query;
        const result = await getAppointmentStats({ from, to, groupBy });
        return res.status(200).json({
            message: "Appointment statistics retrieved successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get appointment statistics",
        });
    }
};

export const getDoctorStatsController = async (req, res) => {
    try {
        const { from, to, page, limit } = req.query;
        const result = await getDoctorStats({
            from,
            to,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });
        return res.status(200).json({
            message: "Doctor statistics retrieved successfully",
            ...result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get doctor statistics",
        });
    }
};

export const getFeedbackStatsController = async (req, res) => {
    try {
        const { from, to } = req.query;
        const result = await getFeedbackStats({ from, to });
        return res.status(200).json({
            message: "Feedback statistics retrieved successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get feedback statistics",
        });
    }
};

export const getAccountStatsController = async (req, res) => {
    try {
        const { from, to, groupBy } = req.query;
        const result = await getAccountStats({ from, to, groupBy });
        return res.status(200).json({
            message: "Account statistics retrieved successfully",
            data: result,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get account statistics",
        });
    }
};
