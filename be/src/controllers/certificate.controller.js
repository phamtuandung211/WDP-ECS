import {
    getDoctorCertificatesService,
    addCertificateService,
    getCertificateDetailService,
    updateCertificateService,
    softDeleteCertificateService,
    reviewCertificateService,
} from "../services/certificate.service.js";

/**
 * @route GET /api/certificates/my-certificates
 */
export const getDoctorCertificates = async (req, res) => {
    try {
        const result = await getDoctorCertificatesService(req.user.accountId, req.query);

        return res.status(200).json({
            message: "Certificates fetched successfully",
            ...result,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route POST /api/certificates/add-my-certificates
 */
export const addCertificate = async (req, res) => {
    try {
        const certificate = await addCertificateService(req.user.accountId, req.body, req.file);

        return res.status(201).json({
            message: "Certificate added successfully. Pending review.",
            data: certificate,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route GET /api/certificates/my-certificates/:certificateId
 */
export const getCertificateDetail = async (req, res) => {
    try {
        const certificate = await getCertificateDetailService(req.user.accountId, req.params.certificateId);

        return res.status(200).json({
            message: "Certificate detail fetched successfully",
            data: certificate,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route PUT /api/certificates/my-certificates/:certificateId
 */
export const updateCertificate = async (req, res) => {
    try {
        const certificate = await updateCertificateService(
            req.user.accountId,
            req.params.certificateId,
            req.body,
            req.file
        );

        return res.status(201).json({
            message: "Certificate updated successfully. New version pending review.",
            data: certificate,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route DELETE /api/certificates/my-certificates/:certificateId
 */
export const softDeleteCertificate = async (req, res) => {
    try {
        const certificate = await softDeleteCertificateService(req.user.accountId, req.params.certificateId);

        return res.status(200).json({
            message: "Certificate deleted successfully",
            data: certificate,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route PATCH /api/certificates/:certificateId/review
 */
export const reviewCertificate = async (req, res) => {
    try {
        const certificate = await reviewCertificateService(
            req.params.certificateId,
            req.body,
            req.user.accountId
        );

        return res.status(200).json({
            message: `Certificate ${certificate.status.toLowerCase()} successfully`,
            data: certificate,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};