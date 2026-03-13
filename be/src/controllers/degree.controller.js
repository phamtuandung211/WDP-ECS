// controllers/degree.controller.js
import {
    getAllDegreeNamesService,
    getDoctorDegreesService,
    addDegreeService,
    getDegreeDetailService,
    updateDegreeService,
    softDeleteDegreeService,
    reviewDegreeService,
    getAllDegreesForStaffService,
} from "../services/degree.service.js";

/**
 * @route GET /api/degrees/names
 */
export const getAllDegreeNames = async (req, res) => {
    try {
        const names = await getAllDegreeNamesService();

        return res.status(200).json({
            message: "Unique degree names fetched successfully",
            data: names,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

/**
 * @route GET /api/degrees/my-degrees
 */
export const getDoctorDegrees = async (req, res) => {
    try {
        const result = await getDoctorDegreesService(req.user.accountId, req.query);

        return res.status(200).json({
            message: "Degrees fetched successfully",
            ...result,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route POST /api/degrees/my-degrees
 */
export const addDegree = async (req, res) => {
    try {
        const degree = await addDegreeService(req.user.accountId, req.body, req.file);

        return res.status(201).json({
            message: "Degree added successfully. Pending review.",
            data: degree,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route GET /api/degrees/my-degrees/:degreeId
 */
export const getDegreeDetail = async (req, res) => {
    try {
        const degree = await getDegreeDetailService(req.user.accountId, req.params.degreeId);

        return res.status(200).json({
            message: "Degree detail fetched successfully",
            data: degree,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route PUT /api/degrees/my-degrees/:degreeId
 */
export const updateDegree = async (req, res) => {
    try {
        const degree = await updateDegreeService(
            req.user.accountId,
            req.params.degreeId,
            req.body,
            req.file
        );

        return res.status(201).json({
            message: "Degree updated successfully. New version pending review.",
            data: degree,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route DELETE /api/degrees/my-degrees/:degreeId
 */
export const softDeleteDegree = async (req, res) => {
    try {
        const degree = await softDeleteDegreeService(req.user.accountId, req.params.degreeId);

        return res.status(200).json({
            message: "Degree deleted successfully",
            data: degree,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route PATCH /api/degrees/:degreeId/review
 */
export const reviewDegree = async (req, res) => {
    try {
        const degree = await reviewDegreeService(
            req.params.degreeId,
            req.body,
            req.user.accountId
        );

        return res.status(200).json({
            message: `Degree ${degree.status.toLowerCase()} successfully`,
            data: degree,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

/**
 * @route GET /api/degrees (staff: get all degrees with filter)
 */
export const getAllDegreesForStaff = async (req, res) => {
    try {
        const result = await getAllDegreesForStaffService(req.query);

        return res.status(200).json({
            message: "All degrees fetched successfully",
            ...result,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};