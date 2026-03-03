import {
    getAllDoctorsService,
    getDoctorByIdSerivice,
    getRelatedDoctorsService
} from "../services/doctor.service.js";

/**
 * GET /api/doctors
 */
export const getAllDoctors = async (req, res) => {
    try {
        const result = await getAllDoctorsService(req.query);

        return res.status(200).json({
            message: "Doctors fetched successfully",
            ...result
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch doctors"
        });
    }
};

/**
 * GET /api/doctors/:id
 */
export const getDoctorById = async (req, res) => {
    try {
        const doctor = await getDoctorByIdSerivice(req.params.id);

        return res.status(200).json({
            message: "Doctor fetched successfully",
            data: doctor
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message
        });
    }
};

/**
 * GET /api/doctors/:id/related
 */
export const getRelateDoctors = async (req, res) => {
    try {
        const relatedDoctors = await getRelatedDoctorsService(req.params.id);

        return res.status(200).json({
            message: "Related doctors fetched successfully",
            data: relatedDoctors
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message
        });
    }
};