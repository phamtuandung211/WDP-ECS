import {
    createMedicalRecord,
    getMyMedicalRecords,
    getMedicalRecordById,
    getMedicalRecordByAppointment,
    updateMedicalRecord,
    getAllMedicalRecords,
} from "../services/medicalRecord.service.js";

export const createMedicalRecordController = async (req, res) => {
    try {
        const { accountId } = req.user;
        const { appointmentId, symptoms, diagnosis, prescription, notes, aiSummary } = req.body;

        const record = await createMedicalRecord({
            accountId,
            appointmentId,
            symptoms,
            diagnosis,
            prescription,
            notes,
            aiSummary,
        });

        return res.status(201).json({
            message: "Medical record created successfully",
            data: record,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to create medical record",
        });
    }
};

export const getMyMedicalRecordsController = async (req, res) => {
    try {
        const { accountId } = req.user;
        const { page, limit } = req.query;

        const result = await getMyMedicalRecords({
            accountId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });

        return res.status(200).json(result);
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get medical records",
        });
    }
};

export const getMedicalRecordByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountId, role } = req.user;

        const record = await getMedicalRecordById({ recordId: id, accountId, role });

        return res.status(200).json({
            message: "Medical record retrieved successfully",
            data: record,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get medical record",
        });
    }
};

export const getMedicalRecordByAppointmentController = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { accountId, role } = req.user;

        const record = await getMedicalRecordByAppointment({ appointmentId, accountId, role });

        return res.status(200).json({
            message: "Medical record retrieved successfully",
            data: record,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get medical record",
        });
    }
};

export const updateMedicalRecordController = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountId } = req.user;

        const record = await updateMedicalRecord({
            recordId: id,
            accountId,
            payload: req.body,
        });

        return res.status(200).json({
            message: "Medical record updated successfully",
            data: record,
        });
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to update medical record",
        });
    }
};

export const getAllMedicalRecordsController = async (req, res) => {
    try {
        const { doctorId, customerId, page, limit } = req.query;

        const result = await getAllMedicalRecords({
            doctorId,
            customerId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });

        return res.status(200).json(result);
    } catch (err) {
        return res.status(err.status || 500).json({
            message: err.message || "Failed to get medical records",
        });
    }
};
