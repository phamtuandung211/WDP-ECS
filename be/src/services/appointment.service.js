import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import Customer from "../models/Customer.js";
import Doctor from "../models/Doctor.js";
import Payment from "../models/Payment.js";
import SaleStaff from "../models/SaleStaff.js";
import Account from "../models/Account.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
  PAYMENT_TIMEOUT_MINUTES,
  MAX_BOOKING_ADVANCE_DAYS,
} from "../constants/Appointment.enum.js";
import { SLOT_STATUS } from "../constants/Slot.enum.js";
import { PAYMENT_STATUS } from "../constants/Payment.enum.js";
import { bookSlotByType } from "./slot.service.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";
import { PROFILE_MODEL_BY_ROLE } from "../constants/ProfileModel.enum.js";
import payos from "../config/payos.js";
import MedicalRecord from "../models/MedicalRecord.js";

/**
 * Helper: throw a structured error.
 */
function throwErr(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function validateDesiredDate(desiredDate) {
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_ADVANCE_DAYS);
  maxDate.setHours(23, 59, 59, 999);

  const d = new Date(desiredDate);
  if (isNaN(d.getTime())) throwErr(400, "Invalid desiredDate");

  // Must be in the future
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (d < todayStart) throwErr(400, "Cannot book in the past");

  if (d > maxDate) {
    throwErr(
      400,
      `Cannot book more than ${MAX_BOOKING_ADVANCE_DAYS} days in advance`,
    );
  }
  return d;
}

export const createBasicAppointment = async ({
  customerId,
  desiredDate,
  note,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const validDate = validateDesiredDate(desiredDate);

    // Check customer tồn tại
    const customer = await Customer.findById(customerId)
      .session(session)
      .lean();

    if (!customer) throwErr(404, "Customer not found");

    //  Chuẩn hóa ngày (00:00 → 23:59)
    const dayStart = new Date(validDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(validDate);
    dayEnd.setHours(23, 59, 59, 999);

    //  1 BASIC / customer / ngày
    const existingAppointment = await Appointment.findOne({
      customerId,
      type: APPOINTMENT_TYPE.BASIC,
      status: {
        $in: [APPOINTMENT_STATUS.PENDING_PAYMENT, APPOINTMENT_STATUS.CONFIRMED],
      },
      desiredDate: { $gte: dayStart, $lte: dayEnd },
    }).session(session);

    if (existingAppointment) {
      throwErr(409, "You already have a BASIC appointment on this date");
    }

    //  Tạo appointment (CHƯA assign slot / doctor)
    const paymentExpireAt = new Date(
      Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000,
    );

    const [appointment] = await Appointment.create(
      [
        {
          customerId,
          doctorId: null,
          slotId: null,
          desiredDate: validDate,
          type: APPOINTMENT_TYPE.BASIC,
          status: APPOINTMENT_STATUS.PENDING_PAYMENT,
          paymentExpireAt,
          note,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return appointment.toObject();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const createAdvancedAppointment = async ({
  customerId,
  doctorId,
  slotId,
  note,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!doctorId) throwErr(400, "doctorId is required");
    if (!slotId) throwErr(400, "slotId is required");

    const customer = await Customer.exists({ _id: customerId }).session(
      session,
    );
    if (!customer) throwErr(404, "Customer not found");

    const doctor = await Doctor.exists({ _id: doctorId }).session(session);
    if (!doctor) throwErr(404, "Doctor not found");

    const slot = await Slot.findById(slotId).session(session);
    if (!slot) throwErr(404, "Slot not found");

    if (slot.doctorId.toString() !== doctorId.toString()) {
      throwErr(400, "Slot does not belong to this doctor");
    }

    const conflict = await Appointment.exists({
      slotId,
      type: APPOINTMENT_TYPE.ADVANCED,
      status: {
        $in: [APPOINTMENT_STATUS.PENDING_PAYMENT, APPOINTMENT_STATUS.CONFIRMED],
      },
    }).session(session);

    if (conflict) {
      throwErr(409, "Advanced slot already booked or pending payment");
    }

    const paymentExpireAt = new Date(
      Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000,
    );

    const [appointment] = await Appointment.create(
      [
        {
          customerId,
          type: APPOINTMENT_TYPE.ADVANCED,
          slotId,
          doctorId,
          status: APPOINTMENT_STATUS.PENDING_PAYMENT,
          paymentExpireAt,
          note,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    return appointment.toObject();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const approveBasicAppointment = async (
  appointmentId,
  saleStaffId,
  doctorId,
  slotId,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const saleStaff = await SaleStaff.findById(saleStaffId).session(session);
    if (!saleStaff) throwErr(404, "Sale staff not found");

    const appointment =
      await Appointment.findById(appointmentId).session(session);
    if (!appointment) throwErr(404, "Appointment not found");

    if (appointment.type !== APPOINTMENT_TYPE.BASIC) {
      throwErr(400, "Only BASIC appointments can be approved");
    }

    if (appointment.status !== APPOINTMENT_STATUS.WAITING_ASSIGN) {
      throwErr(400, "Only WAITING_ASSIGN appointments can be approved");
    }

    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor) throwErr(404, "Doctor not found");

    const slot = await Slot.findById(slotId).session(session);
    if (!slot) throwErr(404, "Slot not found");

    if (slot.doctorId.toString() !== doctorId.toString()) {
      throwErr(400, "Slot does not belong to this doctor");
    }

    if (slot.isExclusive) {
      throwErr(409, "Slot already booked as ADVANCED");
    }

    if (slot.bookedCount >= slot.maxPatients) {
      throwErr(409, "Slot is full");
    }

    // Book slot (atomic + safe)
    const bookedSlot = await bookSlotByType(
      slotId,
      APPOINTMENT_TYPE.BASIC,
      session,
    );

    if (!bookedSlot) {
      throwErr(409, "Slot no longer available");
    }

    // Update appointment
    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    appointment.approvedBy = saleStaffId;
    appointment.approvedAt = new Date();
    appointment.doctorId = doctorId;
    appointment.slotId = slotId;

    await appointment.save({ session });

    await session.commitTransaction();

    return appointment.toObject();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllAppointmentsForStaffService = async ({
  accountId,
  role,
  date,
  status,
  type,
  doctorId,
  page = 1,
  limit = 10,
}) => {
  const query = {};

  if (status) query.status = status;

  if (type) query.type = type;

  if (role === ROLE_NAME.SALE_STAFF && doctorId) {
    query.doctorId = doctorId;
  }

  // Doctor chỉ được xem của mình
  if (role === ROLE_NAME.DOCTOR) {
    const doctorProfile = await Doctor.findOne({ accountId });

    if (!doctorProfile) throwErr(404, "Doctor profile not found");

    query.doctorId = doctorProfile._id;
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const slots = await Slot.find({
      date: { $gte: start, $lte: end },
    }).select("_id");

    const slotIds = slots.map((s) => s._id);

    query.slotId = { $in: slotIds };
  }

  const { limit: safeLimit, offset } = buildPagination({
    page,
    limit,
  });

  const [appointments, totalItems] = await Promise.all([
    Appointment.find(query)
      .populate("customerId", "fullName phone email")
      .populate("doctorId", "fullName specializations")
      .populate("slotId")
      .populate("approvedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .lean(),

    Appointment.countDocuments(query),
  ]);

  return {
    data: appointments,
    metadata: getPaginationMetadata(
      appointments.length,
      totalItems,
      safeLimit,
      offset,
    ),
  };
};

export const getCustomerAppointments = async (
  customerId,
  { type, status, page = 1, limit = 20 } = {},
) => {
  const query = { customerId };
  if (type) query.type = type;
  if (status) query.status = status;

  const { limit: safeLimit, offset } = buildPagination({
    page,
    limit,
  });

  const [appointments, totalItems] = await Promise.all([
    Appointment.find(query)
      .populate("slotId")
      .populate("doctorId", "fullName specializations")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .lean(),
    Appointment.countDocuments(query),
  ]);

  const pagination = getPaginationMetadata(
    appointments.length,
    totalItems,
    safeLimit,
    offset,
  );

  return {
    data: appointments,
    metadata: pagination,
  };
};

export const getAppointmentByIdService = async ({
  appointmentId,
  accountId,
}) => {
  try {
    const account = await Account.findById(accountId).populate("role").lean();

    if (!account) {
      const err = new Error("Account not found");
      err.status = 404;
      throw err;
    }

    const roleName = account.role?.name;
    const ProfileModel = PROFILE_MODEL_BY_ROLE[roleName];

    if (!ProfileModel) {
      const err = new Error("Invalid role");
      err.status = 403;
      throw err;
    }

    const profile = await ProfileModel.findOne({ accountId }).lean();

    if (!profile) {
      const err = new Error("Profile not found");
      err.status = 404;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("slotId")
      .populate("doctorId", "fullName specializations")
      .populate("customerId", "fullName phone email")
      .populate("approvedBy", "fullName")
      .lean();

    if (!appointment) {
      const err = new Error("Appointment not found");
      err.status = 404;
      throw err;
    }

    // CUSTOMER chỉ xem lịch của mình
    if (
      roleName === ROLE_NAME.CUSTOMER &&
      appointment.customerId._id.toString() !== profile._id.toString()
    ) {
      const err = new Error("You are not allowed to view this appointment");
      err.status = 403;
      throw err;
    }

    // DOCTOR chỉ xem lịch của mình
    if (
      roleName === ROLE_NAME.DOCTOR &&
      appointment.doctorId?._id.toString() !== profile._id.toString()
    ) {
      const err = new Error("You are not allowed to view this appointment");
      err.status = 403;
      throw err;
    }

    // SALE_STAFF xem tất cả

    return appointment;
  } catch (error) {
    throw error;
  }
};

export const completeAppointment = async (appointmentId, doctorAccountId) => {
  const appointment = await Appointment.findById(appointmentId).populate('doctorId').populate('slotId').lean();

  if (!appointment) throwErr(404, "Appointment not found");

  // Verify doctor owns this appointment
  const doctor = await Doctor.findOne({ accountId: doctorAccountId }).lean();
  if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
    throwErr(403, "You are not the doctor for this appointment");
  }

  // Only CONFIRMED appointments can be completed
  if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
    throwErr(400, `Cannot complete appointment with status: ${appointment.status}`);
  }

  // Check appointment time - must be at or after start time
  const now = new Date();
  const appointmentStart = new Date(appointment.slotId.startTime);
  
  if (now < appointmentStart) {
    const timeLeft = Math.ceil((appointmentStart - now) / 60000);
    throwErr(400, `Appointment starts in ${timeLeft} minutes. Cannot complete yet.`);
  }

  // Check medical record exists
  const medicalRecord = await MedicalRecord.findOne({ appointmentId }).lean();
  
  if (!medicalRecord) {
    throwErr(400, "Cannot complete appointment without a medical record");
  }

  // Update appointment status
  const updated = await Appointment.findByIdAndUpdate(
    appointmentId,
    { status: APPOINTMENT_STATUS.COMPLETED, completedAt: new Date() },
    { new: true }
  ).populate('customerId').populate('doctorId').populate('slotId');

  return updated.toObject();
};

export const cancelAppointment = async (appointmentId, customerId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const appointment =
      await Appointment.findById(appointmentId).session(session);

    if (!appointment) throwErr(404, "Appointment not found");

    if (appointment.customerId.toString() !== customerId.toString()) {
      throwErr(403, "You can only cancel your own appointments");
    }

    if (appointment.status != APPOINTMENT_STATUS.PENDING_PAYMENT) {
      throwErr(
        400,
        `Cannot cancel appointment with status ${appointment.status}`,
      );
    }

    const payment = await Payment.findOne({
      appointmentId,
      status: PAYMENT_STATUS.PENDING,
    }).session(session);

    // cancel payment link on PayOS
    if (payment) {
      await payos.paymentRequests.cancel(payment.orderCode);

      payment.status = PAYMENT_STATUS.CANCELED;
      payment.canceledAt = new Date();
      await payment.save({ session });
    }

    // Update appointment
    appointment.status = APPOINTMENT_STATUS.CANCELED;

    await appointment.save({ session });

    // Update payment → CANCELED (only if still pending)
    await Payment.updateOne(
      {
        appointmentId: appointment._id,
        status: PAYMENT_STATUS.PENDING,
      },
      {
        status: PAYMENT_STATUS.CANCELED,
      },
      { session },
    );

    await session.commitTransaction();

    return appointment.toObject();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────
//  AUTO-CANCEL EXPIRED (CRON)
// ─────────────────────────────────────────────

export const autoExpirePendingAppointments = async () => {
  const now = new Date();

  const expiredAppointments = await Appointment.find({
    status: APPOINTMENT_STATUS.PENDING_PAYMENT,
    paymentExpireAt: { $lte: now },
  }).select("_id slotId");

  if (!expiredAppointments.length) {
    return { expired: 0 };
  }

  let expiredCount = 0;

  for (const appointment of expiredAppointments) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Re-check inside transaction (race-safe)
      const apt = await Appointment.findOne({
        _id: appointment._id,
        status: APPOINTMENT_STATUS.PENDING_PAYMENT,
      }).session(session);

      if (!apt) {
        await session.commitTransaction();
        continue;
      }

      // Hard delete appointment
      await Appointment.deleteOne({ _id: apt._id }).session(session);
      await Payment.deleteOne({ appointmentId: apt._id }).session(session);
      await session.commitTransaction();
      expiredCount++;
    } catch (err) {
      await session.abortTransaction();
      console.error(
        `[AutoExpire] Failed for appointment ${appointment._id}:`,
        err.message,
      );
    } finally {
      session.endSession();
    }
  }

  if (expiredCount > 0) {
    console.log(
      `[AutoExpire] Deleted ${expiredCount} expired pending appointments`,
    );
  }

  return { expired: expiredCount };
};
