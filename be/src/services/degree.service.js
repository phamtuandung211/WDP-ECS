// services/degree.service.js
import Degree from "../models/Degree.js";
import Doctor from "../models/Doctor.js";
import SaleStaff from "../models/SaleStaff.js";
import { DEGREE_STATUS } from "../constants/Degree.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";


/**
 * Get all unique degree names
 */
export const getAllDegreeNamesService = async () => {
    const names = await Degree.distinct("name");
    return names;
};

/**
 * Get doctor by accountId (helper)
 */
const getDoctorByAccountId = async (accountId) => {
    const doctor = await Doctor.findOne({ accountId });
    if (!doctor) {
        const error = new Error("Doctor profile not found");
        error.statusCode = 404;
        throw error;
    }
    return doctor;
};

/**
 * List all degrees of a doctor with filter, search, sort, pagination
 */
export const getDoctorDegreesService = async (accountId, query) => {
    const doctor = await getDoctorByAccountId(accountId);

    const { page, limit, status, search, sortBy, order } = query;
    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    const filter = { doctorId: doctor._id };

    if (status) {
        filter.status = status;
    }

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    let sortOption = { createdAt: -1 };
    if (sortBy) {
        sortOption = { [sortBy]: order === "asc" ? 1 : -1 };
    }

    const totalItems = await Degree.countDocuments(filter);

    const degrees = await Degree.find(filter)
        .populate("reviewedBy", "fullName")
        .sort(sortOption)
        .skip(offset)
        .limit(safeLimit);

    const pagination = getPaginationMetadata(degrees.length, totalItems, safeLimit, offset);

    return { data: degrees, metadata: pagination };
};

/**
 * Add a new degree for doctor (status = PENDING)
 */
export const addDegreeService = async (accountId, { name }, file) => {
    const doctor = await getDoctorByAccountId(accountId);

    if (!file) {
        const error = new Error("Degree file is required");
        error.statusCode = 400;
        throw error;
    }

    const degree = await Degree.create({
        doctorId: doctor._id,
        name,
        fileUrl: file.path,
        status: DEGREE_STATUS.PENDING,
    });

    return degree;
};

/**
 * Get degree detail by degreeId (must belong to doctor)
 */
export const getDegreeDetailService = async (accountId, degreeId) => {
    const doctor = await getDoctorByAccountId(accountId);

    const degree = await Degree
        .findOne({ _id: degreeId, doctorId: doctor._id })
        .populate("reviewedBy", "fullName")
    if (!degree) {
        const error = new Error("Degree not found");
        error.statusCode = 404;
        throw error;
    }

    return degree;
};

/**
 * Update degree: creates a new record, old record gets replacedBy
 */
export const updateDegreeService = async (accountId, degreeId, { name }, file) => {
    const doctor = await getDoctorByAccountId(accountId);

    const oldDegree = await Degree.findOne({ _id: degreeId, doctorId: doctor._id });
    if (!oldDegree) {
        const error = new Error("Degree not found");
        error.statusCode = 404;
        throw error;
    }

    if (oldDegree.replacedBy) {
        const error = new Error("This degree has already been replaced");
        error.statusCode = 400;
        throw error;
    }

    const newDegree = await Degree.create({
        doctorId: doctor._id,
        name: name || oldDegree.name,
        fileUrl: file ? file.path : oldDegree.fileUrl,
        status: DEGREE_STATUS.PENDING,
    });

    oldDegree.replacedBy = newDegree._id;
    await oldDegree.save();

    return newDegree;
};

/**
 * Soft delete degree: change status to OUTOFDATE
 */
export const softDeleteDegreeService = async (accountId, degreeId) => {
    const doctor = await getDoctorByAccountId(accountId);

    const degree = await Degree.findOne({ _id: degreeId, doctorId: doctor._id });
    if (!degree) {
        const error = new Error("Degree not found");
        error.statusCode = 404;
        throw error;
    }

    if (degree.status === DEGREE_STATUS.OUTOFDATE) {
        const error = new Error("Degree is already deleted");
        error.statusCode = 400;
        throw error;
    }

    degree.status = DEGREE_STATUS.OUTOFDATE;
    await degree.save();

    return degree;
};

/**
 * Get all degrees for staff review (with pagination, filter, search)
 */
export const getAllDegreesForStaffService = async (query) => {
    const { page, limit, status, search, sortBy, order } = query;
    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    let sortOption = { createdAt: -1 };
    if (sortBy) sortOption = { [sortBy]: order === "asc" ? 1 : -1 };

    const totalItems = await Degree.countDocuments(filter);

    const degrees = await Degree.find(filter)
        .populate("doctorId", "fullName")
        .populate("reviewedBy", "fullName")
        .sort(sortOption)
        .skip(offset)
        .limit(safeLimit);

    const pagination = getPaginationMetadata(degrees.length, totalItems, safeLimit, offset);
    return { data: degrees, metadata: pagination };
};

/**
 * Sale staff review degree: approve or reject
 * On approve: new degree -> APPROVED, if it replaced an old one -> old becomes OUTOFDATE
 * On reject: degree -> REJECTED + note
 */
export const reviewDegreeService = async (degreeId, { action, note }, accountId) => {
    const degree = await Degree.findById(degreeId);
    const saleStaffId = await SaleStaff.findOne({ accountId }).select("_id");

    if (!degree) {
        const error = new Error("Degree not found");
        error.statusCode = 404;
        throw error;
    }

    if (degree.status !== DEGREE_STATUS.PENDING) {
        const error = new Error("Only PENDING degrees can be reviewed");
        error.statusCode = 400;
        throw error;
    }

    if (action === DEGREE_STATUS.APPROVED) {
        degree.status = DEGREE_STATUS.APPROVED;
        degree.reviewedBy = saleStaffId._id;
        degree.reviewedAt = new Date();
        if (note) degree.note = note;
        await degree.save();

        // If this degree replaced an old one, mark old as OUTOFDATE
        const oldDegree = await Degree.findOne({ replacedBy: degree._id });
        if (oldDegree) {
            oldDegree.status = DEGREE_STATUS.OUTOFDATE;
            await oldDegree.save();
        }
    } else if (action === DEGREE_STATUS.REJECTED) {
        degree.status = DEGREE_STATUS.REJECTED;
        degree.reviewedBy = saleStaffId._id;
        degree.reviewedAt = new Date();
        if (note) degree.note = note;
        await degree.save();

        // If this was a replacement, remove replacedBy from old degree so doctor can try again
        const oldDegree = await Degree.findOne({ replacedBy: degree._id });
        if (oldDegree) {
            oldDegree.replacedBy = null;
            await oldDegree.save();
        }
    } else {
        const error = new Error("Invalid action. Use 'approve' or 'reject'");
        error.statusCode = 400;
        throw error;
    }

    return degree;
};