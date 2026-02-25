import { APPOINTMENT_TYPE } from "../constants/Appointment.enum.js";
import { getAvailableSlots } from "../services/slot.service.js";

export const getSlots = async (req, res) => {
  try {
    const { date, type, doctorId } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ message: "Query param 'date' is required (YYYY-MM-DD)" });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (type && !Object.values(APPOINTMENT_TYPE).includes(type)) {
      return res.status(400).json({
        message: "Invalid slot type. Only BASIC or ADVANCED allowed",
      });
    }

    const slots = await getAvailableSlots({ date: parsedDate, type, doctorId });

    return res.status(200).json({
      message: "Slots retrieved successfully",
      data: slots,
      total: slots.length,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to retrieve slots",
    });
  }
};
