import Doctor from "../models/Doctor.js";
import Specialization from "../models/Specialization.js";


/**
 * Get all doctors
 * @route GET /api/doctors
 */
export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json({
            message: "Doctors fetched successfully",
            data: doctors
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch doctors" });

    }
}

/**
 * Get doctor by id
 * @route GET /api/doctors/:id
 */
export const getDoctorById = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: `Doctor with id ${doctorId} not found` });
        }
        return res.json({
            message: "Doctor fetched successfully",
            data: doctor
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `Failed to fetch doctor` })
    }
}

/**
 * Get related doctors
 * @route GET /api/doctors/relateddoctors/:id
 */

export const getRelateDoctors = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if (!doctor.specializations || doctor.specializations.length === 0) {
            return res.status(404).json({ message: "Doctor has no specializations" });
        }

        const relatedDoctors = await Doctor.find({
            _id: { $ne: doctor._id },
            specializations: { $in: doctor.specializations }
        }).limit(5);

        return res.status(200).json({
            message: "Related doctors fetched successfully",
            data: relatedDoctors
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch related doctors" });
    }
};
