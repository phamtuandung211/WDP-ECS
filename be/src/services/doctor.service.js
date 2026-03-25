import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";
import Degree from "../models/Degree.js";
import Certificate from "../models/Certificate.js";
import { DEGREE_STATUS } from "../constants/Degree.enum.js";
import { CERTIFICATE_STATUS } from "../constants/Certificate.enum.js";

export const getAllDoctorsService = async (query) => {
  try {
    const {
      page,
      limit,
      search,
      specialization,
      degree,
      sortByExperience, // asc | desc
    } = query;

    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    // =============================
    // 1️⃣ Build filter object
    // =============================
    const filter = {};

    // 🔎 Search doctor by name
    if (search) {
      filter.fullName = { $regex: search, $options: "i" }; // không phân biệt hoa thường
    }

    // 🏥 Filter by specialization
    if (specialization) {
      filter.specializations = new mongoose.Types.ObjectId(specialization);
    }

    // 🎓 Filter by degree
    if (degree) {
      const doctorIds = await Degree.find({
        name: { $regex: degree, $options: "i" },
      }).distinct("doctorId");

      filter._id = { $in: doctorIds };
    }

    // =============================
    // 2️⃣ Sort
    // =============================
    let sortOption = {};
    if (sortByExperience) {
      sortOption.experienceYears = sortByExperience === "desc" ? -1 : 1;
    }

    // =============================
    // 3️⃣ Count total
    // =============================
    const totalItems = await Doctor.countDocuments(filter);

    // =============================
    // 4️⃣ Query doctors
    // =============================
    const doctors = await Doctor.find(filter)
      .populate({
        path: "specializations",
        select: "name",
      })
      .sort(sortOption)
      .skip(offset)
      .limit(safeLimit)
      .lean();

    // 5️⃣ Get degrees for each doctor
    const doctorsWithDegrees = await Promise.all(
      doctors.map(async (doctor) => {
        const degrees = await Degree.find({
          doctorId: doctor._id,
          status: DEGREE_STATUS.APPROVED,
        }).select("name");

        return {
          ...doctor,
          degrees: degrees,
        };
      }),
    );

    const pagination = getPaginationMetadata(
      doctorsWithDegrees.length,
      totalItems,
      safeLimit,
      offset,
    );

    return {
      data: doctorsWithDegrees,
      metadata: pagination,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getDoctorByIdService = async (doctorId) => {
  try {
    // 1️⃣ Lấy doctor + populate specialization
    const doctor = await Doctor.findById(doctorId).populate({
      path: "specializations",
      select: "name",
    });

    if (!doctor) {
      const error = new Error(`Doctor with id ${doctorId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 2️⃣ Lấy degree đã APPROVED
    const degrees = await Degree.find({
      doctorId,
      status: DEGREE_STATUS.APPROVED,
    }).select("name fileUrl createdAt");

    // 3️⃣ Lấy certificate đã APPROVED
    const certificates = await Certificate.find({
      doctorId,
      status: CERTIFICATE_STATUS.APPROVED,
    }).select("name issuedBy issueDate fileUrl");

    // 4️⃣ Trả về object đầy đủ
    return {
      ...doctor.toObject(),
      degrees,
      certificates,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getRelatedDoctorsService = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      const error = new Error(`Doctor with id ${doctorId} not found`);
      error.statusCode = 404;
      throw error;
    }

    if (!doctor.specializations || doctor.specializations.length === 0) {
      const error = new Error(
        `Doctor with id ${doctorId} has no specializations`,
      );
      error.statusCode = 400;
      throw error;
    }
    const relatedDoctors = await Doctor.find({
      _id: { $ne: doctor._id }, // Loại trừ chính doctor này
      specializations: { $in: doctor.specializations }, // Tìm doctor có ít nhất 1 specialization giống nhau
    }).limit(5); // Giới hạn số lượng doctor liên quan trả về

    return relatedDoctors;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getDoctorProfileService = async (accountId) => {
  const doctor = await Doctor.findOne({ accountId }).populate({
    path: "specializations",
    select: "name",
  });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.statusCode = 404;
    throw error;
  }

  const degrees = await Degree.find({
    doctorId: doctor._id,
    status: DEGREE_STATUS.APPROVED,
  }).select("name fileUrl createdAt");

  const certificates = await Certificate.find({
    doctorId: doctor._id,
    status: CERTIFICATE_STATUS.APPROVED,
  }).select("name issuedBy issueDate fileUrl");

  return {
    ...doctor.toObject(),
    degrees,
    certificates,
  };
};

export const updateDoctorProfileService = async (
  accountId,
  updateData,
  file,
) => {
  const doctor = await Doctor.findOne({ accountId });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = [
    "fullName",
    "phone",
    "gender",
    "dateOfBirth",
    "address",
    "experienceYears",
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      doctor[field] = updateData[field];
    }
  }

  // Update specializations
  if (updateData.specializations) {
    const specs = Array.isArray(updateData.specializations)
      ? updateData.specializations
      : [updateData.specializations];
    doctor.specializations = specs;
  }

  // Update image via Cloudinary if file is uploaded
  if (file) {
    doctor.img = file.path;
  }

  await doctor.save();

  return doctor.populate({
    path: "specializations",
    select: "name",
  });
};
