import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Account from "../models/Account.js";
import Doctor from "../models/Doctor.js";
import Customer from "../models/Customer.js";
import MedicalRecord from "../models/MedicalRecord.js";
import Feedback from "../models/Feedback.js";
import { APPOINTMENT_STATUS, APPOINTMENT_TYPE } from "../constants/Appointment.enum.js";
import { PAYMENT_STATUS } from "../constants/Payment.enum.js";
import { ACCOUNT_STATUS } from "../constants/Account.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";

function throwErr(status, message) {
    const err = new Error(message);
    err.status = status;
    throw err;
}

/**
 * Build date range filter from query params: from / to (YYYY-MM-DD)
 */
function buildDateRange(from, to) {
    const filter = {};
    if (from) {
        const start = new Date(from);
        if (isNaN(start)) throwErr(400, "Invalid 'from' date");
        start.setHours(0, 0, 0, 0);
        filter.$gte = start;
    }
    if (to) {
        const end = new Date(to);
        if (isNaN(end)) throwErr(400, "Invalid 'to' date");
        end.setHours(23, 59, 59, 999);
        filter.$lte = end;
    }
    return Object.keys(filter).length ? filter : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tổng quan: tổng số tài khoản, cuộc hẹn, doanh thu, phản hồi trung bình
 */
export const getOverviewStats = async ({ from, to }) => {
    const dateRange = buildDateRange(from, to);
    const createdAtFilter = dateRange ? { createdAt: dateRange } : {};

    const [
        totalAccounts,
        activeAccounts,
        totalDoctors,
        totalCustomers,
        totalAppointments,
        appointmentsByStatus,
        appointmentsByType,
        revenueResult,
        totalMedicalRecords,
        feedbackStats,
    ] = await Promise.all([
        // Accounts
        Account.countDocuments({ ...createdAtFilter }),
        Account.countDocuments({ status: ACCOUNT_STATUS.ACTIVE, ...createdAtFilter }),
        Doctor.countDocuments({ ...createdAtFilter }),
        Customer.countDocuments({ ...createdAtFilter }),

        // Appointments
        Appointment.countDocuments({ ...createdAtFilter }),

        // Appointments grouped by status
        Appointment.aggregate([
            { $match: createdAtFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // Appointments grouped by type
        Appointment.aggregate([
            { $match: createdAtFilter },
            { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),

        // Revenue: tổng tiền từ payments thành công
        Payment.aggregate([
            {
                $match: {
                    status: PAYMENT_STATUS.SUCCESS,
                    ...(dateRange ? { paidAt: dateRange } : {}),
                },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),

        // Medical records
        MedicalRecord.countDocuments({ ...createdAtFilter }),

        // Feedback: avg rating + count
        Feedback.aggregate([
            { $match: createdAtFilter },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$point" },
                    totalFeedbacks: { $sum: 1 },
                },
            },
        ]),
    ]);

    // Normalize appointment status map
    const statusMap = {};
    for (const s of appointmentsByStatus) statusMap[s._id] = s.count;

    // Normalize appointment type map
    const typeMap = {};
    for (const t of appointmentsByType) typeMap[t._id] = t.count;

    const totalRevenue = revenueResult[0]?.total ?? 0;
    const avgRating = feedbackStats[0]?.avgRating
        ? parseFloat(feedbackStats[0].avgRating.toFixed(2))
        : null;
    const totalFeedbacks = feedbackStats[0]?.totalFeedbacks ?? 0;

    return {
        accounts: {
            total: totalAccounts,
            active: activeAccounts,
            doctors: totalDoctors,
            customers: totalCustomers,
        },
        appointments: {
            total: totalAppointments,
            byStatus: statusMap,
            byType: typeMap,
        },
        revenue: {
            total: totalRevenue,
        },
        medicalRecords: {
            total: totalMedicalRecords,
        },
        feedbacks: {
            total: totalFeedbacks,
            avgRating,
        },
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE STATS (theo tháng / ngày)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thống kê doanh thu theo tháng hoặc ngày
 * groupBy: "day" | "month" (default: "month")
 */
export const getRevenueStats = async ({ from, to, groupBy = "month" }) => {
    const dateRange = buildDateRange(from, to);
    const matchStage = {
        status: PAYMENT_STATUS.SUCCESS,
        ...(dateRange ? { paidAt: dateRange } : {}),
    };

    const dateFormat = groupBy === "day" ? "%Y-%m-%d" : "%Y-%m";

    const result = await Payment.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: "$paidAt" } },
                totalRevenue: { $sum: "$amount" },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: "$_id", totalRevenue: 1, count: 1 } },
    ]);

    return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT STATS (theo tháng / ngày)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thống kê cuộc hẹn theo tháng hoặc ngày, chia nhỏ theo status / type
 */
export const getAppointmentStats = async ({ from, to, groupBy = "month" }) => {
    const dateRange = buildDateRange(from, to);
    const matchStage = dateRange ? { createdAt: dateRange } : {};
    const dateFormat = groupBy === "day" ? "%Y-%m-%d" : "%Y-%m";

    const result = await Appointment.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    period: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                    status: "$status",
                    type: "$type",
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.period": 1 } },
        {
            $group: {
                _id: "$_id.period",
                breakdown: {
                    $push: {
                        status: "$_id.status",
                        type: "$_id.type",
                        count: "$count",
                    },
                },
                total: { $sum: "$count" },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: "$_id", total: 1, breakdown: 1 } },
    ]);

    return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Xếp hạng bác sĩ theo số cuộc hẹn, doanh thu, và rating trung bình
 */
export const getDoctorStats = async ({ from, to, page = 1, limit = 10 }) => {
    const dateRange = buildDateRange(from, to);
    const matchStage = dateRange ? { createdAt: dateRange } : {};

    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    const pipeline = [
        { $match: { ...matchStage, doctorId: { $ne: null } } },

        {
            $group: {
                _id: "$doctorId",
                totalAppointments: { $sum: 1 },
                confirmed: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", APPOINTMENT_STATUS.CONFIRMED] },
                            1,
                            0,
                        ],
                    },
                },
                completed: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", APPOINTMENT_STATUS.COMPLETED] },
                            1,
                            0,
                        ],
                    },
                },
                canceled: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", APPOINTMENT_STATUS.CANCELED] },
                            1,
                            0,
                        ],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "doctors",
                localField: "_id",
                foreignField: "_id",
                as: "doctor",
            },
        },

        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: false } },

        { $sort: { totalAppointments: -1 } },

        { $skip: offset },
        { $limit: safeLimit },

        {
            $project: {
                _id: 0,
                doctorId: "$_id",
                fullName: "$doctor.fullName",
                specializations: "$doctor.specializations",
                totalAppointments: 1,
                confirmed: 1,
                completed: 1,
                canceled: 1,
            },
        },
    ];

    const appointmentAgg = await Appointment.aggregate(pipeline);

    const totalDoctors = await Appointment.distinct("doctorId", {
        ...matchStage,
        doctorId: { $ne: null },
    });

    return {
        data: appointmentAgg,
        metadata: getPaginationMetadata(
            appointmentAgg.length,
            totalDoctors.length,
            safeLimit,
            offset,
        ),
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK STATS (rating distribution)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phân bổ rating (1-5 sao), feedback chưa được review
 */
export const getFeedbackStats = async ({ from, to }) => {
    const dateRange = buildDateRange(from, to);
    const matchStage = dateRange ? { createdAt: dateRange } : {};

    const [distribution, unreviewed, avgResult] = await Promise.all([
        Feedback.aggregate([
            { $match: matchStage },
            { $group: { _id: "$point", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, point: "$_id", count: 1 } },
        ]),
        Feedback.countDocuments({
            ...matchStage,
            $or: [{ reviewedBy: null }, { reviewedBy: { $exists: false } }],
        }),
        Feedback.aggregate([
            { $match: matchStage },
            { $group: { _id: null, avg: { $avg: "$point" }, total: { $sum: 1 } } },
        ]),
    ]);

    return {
        avgRating: avgResult[0]?.avg ? parseFloat(avgResult[0].avg.toFixed(2)) : null,
        totalFeedbacks: avgResult[0]?.total ?? 0,
        unreviewedCount: unreviewed,
        distribution,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT STATS (new registrations by month)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thống kê tài khoản mới đăng ký theo tháng/ngày, chia theo role
 */
export const getAccountStats = async ({ from, to, groupBy = "month" }) => {
    const dateRange = buildDateRange(from, to);
    const matchStage = dateRange ? { createdAt: dateRange } : {};
    const dateFormat = groupBy === "day" ? "%Y-%m-%d" : "%Y-%m";

    const result = await Account.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "roles",
                localField: "role",
                foreignField: "_id",
                as: "roleInfo",
            },
        },
        { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: {
                    period: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                    role: "$roleInfo.name",
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.period": 1 } },
        {
            $group: {
                _id: "$_id.period",
                total: { $sum: "$count" },
                byRole: { $push: { role: "$_id.role", count: "$count" } },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: "$_id", total: 1, byRole: 1 } },
    ]);

    return result;
};
