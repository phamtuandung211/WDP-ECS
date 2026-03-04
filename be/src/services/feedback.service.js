import Feedback from "../models/Feedback.js";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import CustomerSupport from "../models/CustomerSupport.js";
import { APPOINTMENT_STATUS } from "../constants/Appointment.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";

function throwErr(status, message) {
    const err = new Error(message);
    err.status = status;
    throw err;
}


export const createFeedback = async ({ accountId, appointmentId, point, comment }) => {
    // --- Validation ---
    const errors = {};
    if (!appointmentId)
        errors.appointmentId = "appointmentId is required";
    else if (!/^[a-f\d]{24}$/i.test(String(appointmentId)))
        errors.appointmentId = "appointmentId must be a valid MongoDB ObjectId";

    if (point === undefined || point === null)
        errors.point = "point is required";
    else if (typeof point !== "number" || !Number.isInteger(point))
        errors.point = "point must be an integer";
    else if (point < 1 || point > 5)
        errors.point = "point must be between 1 and 5";

    if (comment !== undefined) {
        if (typeof comment !== "string")
            errors.comment = "comment must be a string";
        else if (comment.trim().length > 1000)
            errors.comment = "comment must not exceed 1000 characters";
    }

    if (Object.keys(errors).length > 0)
        throwErr(400, JSON.stringify({ message: "Validation failed", errors }));
    // --- End Validation ---
    const customer = await Customer.findOne({ accountId }).lean();
    if (!customer) throwErr(404, "Customer profile not found");

    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) throwErr(404, "Appointment not found");

    // Chỉ customer sở hữu cuộc hẹn mới được gửi feedback
    if (appointment.customerId.toString() !== customer._id.toString()) {
        throwErr(403, "You can only review your own appointments");
    }

    // Cuộc hẹn phải ở trạng thái CONFIRMED (đã diễn ra)
    if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
        throwErr(400, `Cannot submit feedback for appointment with status: ${appointment.status}`);
    }

    // Mỗi cuộc hẹn chỉ được feedback 1 lần
    const existing = await Feedback.findOne({ appointmentId }).lean();
    if (existing) {
        throwErr(409, "Feedback already submitted for this appointment");
    }

    const feedback = await Feedback.create({ appointmentId, point, comment });
    return feedback.toObject();
};

export const getMyFeedbacks = async ({ accountId, page = 1, limit = 10 }) => {
    const customer = await Customer.findOne({ accountId }).lean();
    if (!customer) throwErr(404, "Customer profile not found");

    // Lấy tất cả appointmentId của customer rồi lọc feedback
    const appointments = await Appointment.find({ customerId: customer._id }).select("_id").lean();
    const appointmentIds = appointments.map((a) => a._id);

    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    const [feedbacks, totalItems] = await Promise.all([
        Feedback.find({ appointmentId: { $in: appointmentIds } })
            .populate({
                path: "appointmentId",
                select: "desiredDate type status doctorId slotId",
                populate: { path: "doctorId", select: "fullName specializations" },
            })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(safeLimit)
            .lean(),
        Feedback.countDocuments({ appointmentId: { $in: appointmentIds } }),
    ]);

    return {
        data: feedbacks,
        metadata: getPaginationMetadata(feedbacks.length, totalItems, safeLimit, offset),
    };
};

export const getFeedbackByAppointment = async ({ appointmentId, accountId, role }) => {
    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) throwErr(404, "Appointment not found");

    // CUSTOMER chỉ xem feedback của cuộc hẹn mình
    if (role === "CUSTOMER") {
        const customer = await Customer.findOne({ accountId }).lean();
        if (!customer || appointment.customerId.toString() !== customer._id.toString()) {
            throwErr(403, "You are not allowed to view this feedback");
        }
    }

    const feedback = await Feedback.findOne({ appointmentId })
        .populate("reviewedBy", "fullName")
        .lean();

    if (!feedback) throwErr(404, "No feedback found for this appointment");

    return feedback;
};

export const getAllFeedbacks = async ({ point, reviewed, page = 1, limit = 10 }) => {
    const query = {};
    if (point) query.point = Number(point);

    // reviewed=true → có reviewedBy, reviewed=false → chưa có
    if (reviewed === "true") {
        query.reviewedBy = { $ne: null, $exists: true };
    } else if (reviewed === "false") {
        query.$or = [{ reviewedBy: null }, { reviewedBy: { $exists: false } }];
    }

    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    const [feedbacks, totalItems] = await Promise.all([
        Feedback.find(query)
            .populate({
                path: "appointmentId",
                select: "desiredDate type status customerId doctorId",
                populate: [
                    { path: "customerId", select: "fullName phone" },
                    { path: "doctorId", select: "fullName specializations" },
                ],
            })
            .populate("reviewedBy", "fullName")
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(safeLimit)
            .lean(),
        Feedback.countDocuments(query),
    ]);

    return {
        data: feedbacks,
        metadata: getPaginationMetadata(feedbacks.length, totalItems, safeLimit, offset),
    };
};

export const getFeedbackById = async (feedbackId) => {
    const feedback = await Feedback.findById(feedbackId)
        .populate({
            path: "appointmentId",
            select: "desiredDate type status customerId doctorId",
            populate: [
                { path: "customerId", select: "fullName phone" },
                { path: "doctorId", select: "fullName specializations" },
            ],
        })
        .populate("reviewedBy", "fullName")
        .lean();

    if (!feedback) throwErr(404, "Feedback not found");
    return feedback;
};

export const reviewFeedback = async ({ feedbackId, accountId }) => {
    const support = await CustomerSupport.findOne({ accountId }).lean();
    if (!support) throwErr(404, "Customer support profile not found");

    const feedback = await Feedback.findById(feedbackId).lean();
    if (!feedback) throwErr(404, "Feedback not found");

    if (feedback.reviewedBy) {
        throwErr(409, "This feedback has already been reviewed");
    }

    const updated = await Feedback.findByIdAndUpdate(
        feedbackId,
        { $set: { reviewedBy: support._id } },
        { new: true }
    )
        .populate("reviewedBy", "fullName")
        .lean();

    return updated;
};
