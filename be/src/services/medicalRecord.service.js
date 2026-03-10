import MedicalRecord from "../models/MedicalRecord.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Customer from "../models/Customer.js";
import { APPOINTMENT_STATUS } from "../constants/Appointment.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";

function throwErr(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

export const createMedicalRecord = async ({
  accountId,
  appointmentId,
  symptoms,
  diagnosis,
  prescription,
  notes,
  aiSummary,
}) => {
  if (!symptoms) throwErr(400, "symptoms is required");
  if (!diagnosis) throwErr(400, "diagnosis is required");
  if (!prescription) throwErr(400, "prescription is required");

  const doctor = await Doctor.findOne({ accountId }).lean();
  if (!doctor) throwErr(404, "Doctor profile not found");

  const appointment = await Appointment.findById(appointmentId)
    .populate("slotId")
    .lean();
  if (!appointment) throwErr(404, "Appointment not found");

  // Doctor chỉ được tạo hồ sơ cho cuộc hẹn của mình
  if (appointment.doctorId?.toString() !== doctor._id.toString()) {
    throwErr(403, "You are not the doctor for this appointment");
  }

  // Cuộc hẹn phải đã được xác nhận
  if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
    throwErr(
      400,
      `Cannot create medical record for appointment with status: ${appointment.status}`,
    );
  }

  // Check appointment time - must be at or after start time
  const now = new Date();
  const appointmentStart = new Date(appointment.slotId?.startTime);

  if (now < appointmentStart) {
    const timeLeft = Math.ceil((appointmentStart - now) / 60000);
    throwErr(
      400,
      `Appointment starts in ${timeLeft} minutes. Cannot create medical record yet.`,
    );
  }

  // Kiểm tra đã có hồ sơ cho cuộc hẹn này chưa
  const existing = await MedicalRecord.findOne({ appointmentId }).lean();
  if (existing) {
    throwErr(409, "Medical record already exists for this appointment");
  }

  const record = await MedicalRecord.create({
    appointmentId,
    doctorId: doctor._id,
    customerId: appointment.customerId,
    symptoms,
    diagnosis,
    prescription,
    notes,
    aiSummary,
  });

  return record.toObject();
};

export const getMyMedicalRecords = async ({
  accountId,
  page = 1,
  limit = 10,
}) => {
  const customer = await Customer.findOne({ accountId }).lean();
  if (!customer) throwErr(404, "Customer profile not found");

  const { limit: safeLimit, offset } = buildPagination({ page, limit });

  const [records, totalItems] = await Promise.all([
    MedicalRecord.find({ customerId: customer._id })
      .populate("doctorId", "fullName specializations")
      .populate("appointmentId", "desiredDate type status slotId")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .lean(),
    MedicalRecord.countDocuments({ customerId: customer._id }),
  ]);

  return {
    data: records,
    metadata: getPaginationMetadata(
      records.length,
      totalItems,
      safeLimit,
      offset,
    ),
  };
};

export const getMedicalRecordById = async ({ recordId, accountId, role }) => {
  const record = await MedicalRecord.findById(recordId)
    .populate("doctorId", "fullName specializations")
    .populate("customerId", "fullName phone")
    .populate("appointmentId", "desiredDate type status slotId")
    .lean();

  if (!record) throwErr(404, "Medical record not found");

  // CUSTOMER chỉ xem hồ sơ của mình
  if (role === "CUSTOMER") {
    const customer = await Customer.findOne({ accountId }).lean();
    if (
      !customer ||
      record.customerId._id.toString() !== customer._id.toString()
    ) {
      throwErr(403, "You are not allowed to view this record");
    }
  }

  // DOCTOR chỉ xem hồ sơ mình tạo
  if (role === "DOCTOR") {
    const doctor = await Doctor.findOne({ accountId }).lean();
    if (!doctor || record.doctorId._id.toString() !== doctor._id.toString()) {
      throwErr(403, "You are not allowed to view this record");
    }
  }

  // SALE_STAFF, CUSTOMER_SUPPORT, ADMIN xem tất cả

  return record;
};

export const getMedicalRecordByAppointment = async ({
  appointmentId,
  accountId,
  role,
}) => {
  const record = await MedicalRecord.findOne({ appointmentId })
    .populate("doctorId", "fullName specializations")
    .populate("customerId", "fullName phone")
    .populate("appointmentId", "desiredDate type status slotId")
    .lean();

  if (!record) throwErr(404, "No medical record found for this appointment");

  // CUSTOMER chỉ xem hồ sơ của mình
  if (role === "CUSTOMER") {
    const customer = await Customer.findOne({ accountId }).lean();
    if (
      !customer ||
      record.customerId._id.toString() !== customer._id.toString()
    ) {
      throwErr(403, "You are not allowed to view this record");
    }
  }

  return record;
};

export const updateMedicalRecord = async ({ recordId, accountId, payload }) => {
  const doctor = await Doctor.findOne({ accountId }).lean();
  if (!doctor) throwErr(404, "Doctor profile not found");

  const record = await MedicalRecord.findById(recordId).lean();
  if (!record) throwErr(404, "Medical record not found");

  if (record.doctorId.toString() !== doctor._id.toString()) {
    throwErr(403, "You can only update your own medical records");
  }

  const ALLOWED_FIELDS = [
    "symptoms",
    "diagnosis",
    "prescription",
    "notes",
    "aiSummary",
  ];
  const updateData = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throwErr(400, "No valid fields to update");
  }

  const updated = await MedicalRecord.findByIdAndUpdate(
    recordId,
    { $set: updateData },
    { new: true, runValidators: true },
  )
    .populate("doctorId", "fullName specializations")
    .populate("customerId", "fullName phone")
    .lean();

  return updated;
};

export const getAllMedicalRecords = async ({
  doctorId,
  customerId,
  page = 1,
  limit = 10,
}) => {
  const query = {};
  if (doctorId) query.doctorId = doctorId;
  if (customerId) query.customerId = customerId;

  const { limit: safeLimit, offset } = buildPagination({ page, limit });

  const [records, totalItems] = await Promise.all([
    MedicalRecord.find(query)
      .populate("doctorId", "fullName specializations")
      .populate("customerId", "fullName phone")
      .populate("appointmentId", "desiredDate type status")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .lean(),
    MedicalRecord.countDocuments(query),
  ]);

  return {
    data: records,
    metadata: getPaginationMetadata(
      records.length,
      totalItems,
      safeLimit,
      offset,
    ),
  };
};
