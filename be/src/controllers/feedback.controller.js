import {
    createFeedback,
    getMyFeedbacks,
    getFeedbackByAppointment,
    getAllFeedbacks,
    getFeedbackById,
    reviewFeedback,
} from "../services/feedback.service.js";

export const createFeedbackController = async (req, res) => {
    try {
        const { accountId } = req.user;
        const { appointmentId, point, comment } = req.body;

        const feedback = await createFeedback({ accountId, appointmentId, point, comment });

        return res.status(201).json({
            message: "Feedback submitted successfully",
            data: feedback,
        });
    } catch (err) {
        let body;
        try { body = JSON.parse(err.message); } catch { body = { message: err.message || "Failed to submit feedback" }; }
        return res.status(err.status || 500).json(body);
    }
};


export const getMyFeedbacksController = async (req, res) => {
    try {
        const { accountId } = req.user;
        const { page, limit } = req.query;

        const result = await getMyFeedbacks({
            accountId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });

        return res.status(200).json(result);
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get feedbacks",
        });
    }
};

export const getFeedbackByAppointmentController = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { accountId, role } = req.user;

        const feedback = await getFeedbackByAppointment({ appointmentId, accountId, role });

        return res.status(200).json({
            message: "Feedback retrieved successfully",
            data: feedback,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get feedback",
        });
    }
};

export const getAllFeedbacksController = async (req, res) => {
    try {
        const { point, reviewed, page, limit } = req.query;

        const result = await getAllFeedbacks({
            point,
            reviewed,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });

        return res.status(200).json(result);
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get feedbacks",
        });
    }
};

export const getFeedbackByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await getFeedbackById(id);

        return res.status(200).json({
            message: "Feedback retrieved successfully",
            data: feedback,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get feedback",
        });
    }
};

export const reviewFeedbackController = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountId } = req.user;

        const feedback = await reviewFeedback({ feedbackId: id, accountId });

        return res.status(200).json({
            message: "Feedback reviewed successfully",
            data: feedback,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to review feedback",
        });
    }
};
