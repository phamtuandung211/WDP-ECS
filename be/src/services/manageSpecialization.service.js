import Specialization from "../models/Specialization.js";
import SaleStaff from "../models/SaleStaff.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";


function throwErr(status, message) {
    const err = new Error(message);
    err.status = status;
    throw err;
}

export const getSpecializationDetailService = async (id) => {
    try {
        const specialization = await Specialization.findById(id).populate("createdBy", "fullName");

        if (!specialization) {
            throwErr(404, "The specialization does not exist");
        }

        return specialization;
    } catch (error) {
        console.log(error);
        if (error.status) throw error;
        throwErr(500, "Failed to fetch specialization detail");
    }
};

export const getAllSpecializationsService = async ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "name",
    sortOrder = 1, // 1 for asc, -1 for desc
} = {}) => {
    try {
        // Build pagination
        const { limit: safeLimit, offset, page: safePage } = buildPagination({ page, limit });

        // Build search filter
        const filter = {};
        if (search && search.trim() !== "") {
            filter.name = {
                $regex: search.trim(),
                $options: "i", // case-insensitive
            };
        }

        // Build sort order
        const sortOption = {};
        if (sortBy === "name" || sortBy === "createdAt") {
            sortOption[sortBy] = sortOrder;
        } else {
            sortOption["name"] = 1; // default sort by name asc
        }

        // Get total count for pagination metadata
        const totalItems = await Specialization.countDocuments(filter);

        // Fetch specializations with pagination
        const specializations = await Specialization.find(filter)
            .populate("createdBy", "fullName")
            .sort(sortOption)
            .limit(safeLimit)
            .skip(offset);

        // Get pagination metadata
        const pagination = getPaginationMetadata(
            specializations.length,
            totalItems,
            safeLimit,
            offset
        );

        return {
            data: specializations,
            pagination,
        };
    } catch (error) {
        console.log(error);
        throwErr(500, "Failed fetching specializations");
    }
};

export const createSpecializationService = async (name, accountId) => {
    try {
        if (!name || name.trim() === "") {
            throwErr(400, "The name of specialization is required");
        }

        const existingSpecialization = await Specialization.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i",
            },
        });

        if (existingSpecialization) {
            throwErr(400, "The specialization already existed");
        }

        const saleStaffId = await SaleStaff.findOne({ accountId }).select("_id");

        const specialization = new Specialization({
            name: name.trim(),
            createdBy: saleStaffId,
        });

        await specialization.save();
        return specialization;

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updateSpecializationService = async (id, name, accountId) => {
    try {
        if (!name || name.trim() === "") {
            throwErr(400, "The name of specialization is required");
        }

        const existingSpecialization = await Specialization.findById(id);

        if (!existingSpecialization) {
            throwErr(404, "The specialization does not exist");
        }
        const saleStaffId = await SaleStaff.findOne({ accountId }).select("_id");

        const updatedSpecialization = await Specialization.findByIdAndUpdate(
            id,
            { name: name.trim(), createdBy: saleStaffId },
            { new: true }
        ).populate("createdBy", "fullName");

        return updatedSpecialization;
    } catch (error) {
        console.log(error);
        throwErr(500, "Failed to update specialization");
    }
};

export const deleteSpecializationService = async (id) => {
    try {
        const existingSpecialization = await Specialization.findById(id);

        if (!existingSpecialization) {
            throwErr(404, "The specialization does not exist");
        }

        await Specialization.findByIdAndDelete(id);
        return existingSpecialization;
    } catch (error) {
        console.log(error);
        throwErr(500, "Failed to delete specialization");
    }
};

