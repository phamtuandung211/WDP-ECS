import {
  createBasicAppointment,
  createAdvancedAppointment,
  cancelAppointment,
  getCustomerAppointments,
  approveBasicAppointment,
  getAppointmentByIdService,
  getAllAppointmentsForStaffService,
} from "../services/appointment.service.js";
import { APPOINTMENT_TYPE } from "../constants/Appointment.enum.js";
import Customer from "../models/Customer.js";
import SaleStaff from "../models/SaleStaff.js";

export const createAppointment = async (req, res) => {
  try {
    const { type, desiredDate, doctorId, slotId, note } = req.body;
    const accountId = req.user.accountId;
    const customer = await Customer.findOne({ accountId: accountId });

    if (!type || !Object.values(APPOINTMENT_TYPE).includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid type. Must be BASIC or ADVANCED" });
    }

    let appointment;

    if (type === APPOINTMENT_TYPE.BASIC) {
      if (!desiredDate) {
        return res.status(400).json({ message: "desiredDate is required" });
      }
      appointment = await createBasicAppointment({
        customerId: customer._id,
        desiredDate,
        note,
      });
    } else {
      if (!slotId) {
        return res
          .status(400)
          .json({ message: "slotId is required for ADVANCED appointment" });
      }

      if (!doctorId) {
        return res
          .status(400)
          .json({ message: "doctorId is required for ADVANCED appointment" });
      }

      appointment = await createAdvancedAppointment({
        customerId: customer._id,
        doctorId: doctorId,
        slotId,
        note,
      });
    }

    return res.status(201).json({
      message:
        "Appointment created. Please complete payment within 15 minutes.",
      data: appointment,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to create appointment",
    });
  }
};

export const approveBasicAppointmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.user.accountId;
    const { doctorId, slotId } = req.body;

    if (!doctorId || !slotId) {
      return res.status(400).json({
        message: "doctorId and slotId are required to approve appointment",
      });
    }

    const saleStaff = await SaleStaff.findOne({ accountId: accountId });
    const appointment = await approveBasicAppointment(
      id,
      saleStaff._id,
      doctorId,
      slotId,
    );
    return res.status(200).json({
      message: "Appointment approved successfully",
      data: appointment,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Failed to approve appointment",
    });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    const customer = await Customer.findOne({ accountId: accountId });
    const { type, status, page, limit } = req.query;

    const result = await getCustomerAppointments(customer._id, {
      type,
      status,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to get appointments",
    });
  }
};

export const getAppointmentByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.user.accountId;

    const result = await getAppointmentByIdService({
      appointmentId: id,
      accountId,
    });

    return res.status(200).json({
      message: "Appointment retrieved successfully",
      data: result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Failed to retrieve appointment",
    });
  }
};

export const getAllAppointmentsForStaffController = async (req, res) => {
  try {
    const { accountId, role } = req.user;
    const { date, status, type, doctorId, page, limit } = req.query;

    const result = await getAllAppointmentsForStaffService({
      accountId,
      role,
      date,
      status,
      type,
      doctorId,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Failed to get appointments for staff",
    });
  }
};

export const cancelAppointmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.user.accountId;
    const customer = await Customer.findOne({ accountId: accountId });
    const appointment = await cancelAppointment(id, customer._id);

    return res.status(200).json({
      message: "Appointment canceled successfully",
      data: appointment,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to cancel appointment",
    });
  }
};
