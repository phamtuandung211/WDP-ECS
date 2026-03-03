import Doctor from "../models/Doctor.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";



export const getAllDoctorsService = async (query) => {
    try {
        // Lấy page & limit từ query
        const { page, limit } = query;

        const { limit: safeLimit, offset, page: safePage } = buildPagination({
            page,
            limit,
        });

        // Lấy tổng số doctor
        const totalItems = await Doctor.countDocuments();

        // Lấy danh sách doctor có phân trang
        const doctors = await Doctor.find()
            .skip(offset)
            .limit(safeLimit);

        // Metadata phân trang
        const pagination = getPaginationMetadata(
            doctors.length,
            totalItems,
            safeLimit,
            offset
        );

        return {
            data: doctors,
            metadata: pagination,
        };

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getDoctorByIdSerivice = async (doctorId) => {
    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            const error = new Error(`Doctor with id ${doctorId} not found`);
            error.statusCode = 404;
            throw error;
        }
        return doctor;

    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getRelatedDoctorsService = async (doctorId) => {
    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            const error = new Error(`Doctor with id ${doctorId} not found`);
            error.statusCode = 404;
            throw error;
        }

        if (!doctor.specializations || doctor.specializations.length === 0) {
            const error = new Error(`Doctor with id ${doctorId} has no specializations`);
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
}