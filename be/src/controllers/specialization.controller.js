import Specialization from "../models/Specialization.js";
import {
    getAllSpecializationsService,
    getSpecializationDetailService,
    createSpecializationService,
    updateSpecializationService,
    deleteSpecializationService,
} from "../services/manageSpecialization.service.js";


/**
 * Get all specializations
 * @route GET /api/specializations
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @query {string} search - Search by specialization name
 * @query {string} sortBy - Sort field (default: name)
 * @query {string} sortOrder - Sort direction: asc or desc (default: asc)
 */
export const getAllSpecializations = async (req, res) => {
    try {
        const { page, limit, search, sortBy, sortOrder } = req.query;

        // Convert sortOrder to number (1 for asc, -1 for desc)
        let sortOrderNum = 1;
        if (sortOrder === "desc" || sortOrder === "-1") {
            sortOrderNum = -1;
        }

        const result = await getAllSpecializationsService({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search: search || "",
            sortBy: sortBy || "name",
            sortOrder: sortOrderNum,
        });

        return res.status(200).json({
            message: "Specializations fetched successfully",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to fetch specializations" });
    }
}

/**
 * Get specialization detail
 * @route GET /api/specializations/:id
 */
export const getSpecializationDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const specialization = await getSpecializationDetailService(id);

        return res.status(200).json({
            message: "Specialization fetched successfully",
            data: specialization,
        });
    } catch (error) {
        console.log(error);
        const statusCode = error.status || 500;
        const message = error.message || "Failed to fetch specialization detail";
        return res.status(statusCode).json({ message });
    }
}


/**
 * Create new specialization
 * @route POST /api/specializations/create
 */
export const createSpecialization = async (req, res) => {
    try {
        const { name } = req.body;
        const accountId = req.user.accountId; // Get accountId from the request (set by auth middleware)


        const specialization = await createSpecializationService(
            name,
            accountId
        );


        return res.status(201).json({
            message: "Specialization created successfully",
            data: specialization,
        });

    } catch (error) {
        console.log(error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to create specialization",
        });
    }
};


/**
 * Update specialization
 * @route PUT /api/specializations/update/:id
 */
export const updateSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const accountId = req.user.accountId; // Get accountId from the request (set by auth middleware)

        const updatedSpecialization = await updateSpecializationService(id, name, accountId);

        return res.status(200).json({
            message: "The specialization updated successfully",
            data: updatedSpecialization,
        });
    } catch (error) {
        console.log(error);
        const statusCode = error.message.includes("required") ? 400 : error.message.includes("does not exist") ? 404 : 500;
        const message = statusCode !== 500 ? error.message : "Failed to update specialization";
        return res.status(statusCode).json({ message });
    }
}

/**
 * Delete specialization
 * @route DELETE /api/specializations/delete/:id
 */
export const deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteSpecializationService(id);

        return res.status(200).json({ message: "The specialization deleted successfully" });
    } catch (error) {
        console.log(error);
        const statusCode = error.message.includes("does not exist") ? 404 : 500;
        const message = statusCode === 404 ? error.message : "Failed to delete specialization";
        return res.status(statusCode).json({ message });
    }
}
