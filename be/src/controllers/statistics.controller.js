import {
  getOverviewStats,
  getRevenueStats,
  getAppointmentStats,
  getDoctorStats,
  getFeedbackStats,
  getAccountStats,
} from "../services/statistics.service.js";

// Helper to convert range to from/to dates
function getDateRangeFromRange(range = "month") {
  const now = new Date();
  const from = new Date();

  switch (range) {
    case "week":
      from.setDate(now.getDate() - 7);
      break;
    case "year":
      from.setFullYear(now.getFullYear() - 1);
      break;
    case "month":
    default:
      from.setMonth(now.getMonth() - 1);
      break;
  }

  return { from: from.toISOString(), to: now.toISOString() };
}

export const getOverviewStatsController = async (req, res) => {
  try {
    let { from, to, range } = req.query;

    // If range is provided, convert it to from/to
    if (range && !from && !to) {
      const dateRange = getDateRangeFromRange(range);
      from = dateRange.from;
      to = dateRange.to;
    }

    const result = await getOverviewStats({ from, to });

    // Transform to match frontend expectations
    const transformed = {
      totalAppointments: result.appointments?.total || 0,
      confirmedAppointments: result.appointments?.byStatus?.["CONFIRMED"] || 0,
      completedAppointments: result.appointments?.byStatus?.["COMPLETED"] || 0,
      canceledCount: result.appointments?.byStatus?.["CANCELED"] || 0,
      pendingPaymentCount:
        result.appointments?.byStatus?.["PENDING_PAYMENT"] || 0,
      waitingAssignCount:
        result.appointments?.byStatus?.["WAITING_ASSIGN"] || 0,
      totalRevenue: result.revenue?.total || 0,
      basicRevenue: 0,
      advancedRevenue: 0,
      totalDoctors: result.accounts?.doctors || 0,
      totalCustomers: result.accounts?.customers || 0,
      totalAccounts: result.accounts?.total || 0,
    };

    return res.status(200).json({
      message: "Overview statistics retrieved successfully",
      data: transformed,
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
    let { from, to, range, groupBy } = req.query;

    // If range is provided, convert it to from/to
    if (range && !from && !to) {
      const dateRange = getDateRangeFromRange(range);
      from = dateRange.from;
      to = dateRange.to;
    }

    const result = await getAppointmentStats({ from, to, groupBy });

    // Transform: convert breakdown to top-level count
    const transformed = result.map((stat) => ({
      period: stat.period,
      date: stat.period,
      count: stat.total,
      breakdown: stat.breakdown,
    }));

    return res.status(200).json({
      message: "Appointment statistics retrieved successfully",
      data: transformed,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get appointment statistics",
    });
  }
};

export const getDoctorStatsController = async (req, res) => {
  try {
    let { from, to, page, limit, range } = req.query;

    // If range is provided, convert it to from/to
    if (range && !from && !to) {
      const dateRange = getDateRangeFromRange(range);
      from = dateRange.from;
      to = dateRange.to;
    }

    const result = await getDoctorStats({
      from,
      to,
      page: page ? Number.parseInt(page) : 1,
      limit: limit ? Number.parseInt(limit) : 10,
    });

    // Transform doctor data, rename field to match frontend expectations
    const transformed = result.data.map((doc) => ({
      ...doc,
      name: doc.fullName,
      appointmentCount: doc.totalAppointments,
      avgRating: 0, // Can be fetched from feedback if needed
    }));

    return res.status(200).json({
      message: "Doctor statistics retrieved successfully",
      data: transformed,
      metadata: result.metadata,
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
