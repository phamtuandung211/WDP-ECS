import Certificate from "../models/Certificate.js";
import Doctor from "../models/Doctor.js";
import { CERTIFICATE_STATUS } from "../constants/Certificate.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";
import SaleStaff from "../models/SaleStaff.js";

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
 * List all certificates of a doctor with filter, search, sort, pagination
 */
export const getDoctorCertificatesService = async (accountId, query) => {
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

    const totalItems = await Certificate.countDocuments(filter);

    const certificates = await Certificate.find(filter)
        .populate("reviewedBy", "fullName")
        .sort(sortOption)
        .skip(offset)
        .limit(safeLimit);

    const pagination = getPaginationMetadata(certificates.length, totalItems, safeLimit, offset);

    return { data: certificates, metadata: pagination };
};

/**
 * Add a new certificate for doctor (status = PENDING)
 */
export const addCertificateService = async (accountId, { name, issuedBy, issueDate }, file) => {
    const doctor = await getDoctorByAccountId(accountId);

    if (!file) {
        const error = new Error("Certificate file is required");
        error.statusCode = 400;
        throw error;
    }

    const certificate = await Certificate.create({
        doctorId: doctor._id,
        name,
        issuedBy,
        issueDate,
        fileUrl: file.path,
        status: CERTIFICATE_STATUS.PENDING,
    });

    return certificate;
};

/**
 * Get certificate detail by certificateId (must belong to doctor)
 */
export const getCertificateDetailService = async (accountId, certificateId) => {
    const doctor = await getDoctorByAccountId(accountId);

    const certificate = await Certificate
        .findOne({ _id: certificateId, doctorId: doctor._id })
        .populate("reviewedBy", "fullName");
    if (!certificate) {
        const error = new Error("Certificate not found");
        error.statusCode = 404;
        throw error;
    }

    return certificate;
};

/**
 * Update certificate: creates a new record, old record gets replacedBy
 */
export const updateCertificateService = async (accountId, certificateId, { name, issuedBy, issueDate }, file) => {
    const doctor = await getDoctorByAccountId(accountId);

    const oldCertificate = await Certificate.findOne({ _id: certificateId, doctorId: doctor._id });
    if (!oldCertificate) {
        const error = new Error("Certificate not found");
        error.statusCode = 404;
        throw error;
    }

    if (oldCertificate.replacedBy) {
        const error = new Error("This certificate has already been replaced");
        error.statusCode = 400;
        throw error;
    }

    const newCertificate = await Certificate.create({
        doctorId: doctor._id,
        name: name || oldCertificate.name,
        issuedBy: issuedBy || oldCertificate.issuedBy,
        issueDate: issueDate || oldCertificate.issueDate,
        fileUrl: file ? file.path : oldCertificate.fileUrl,
        status: CERTIFICATE_STATUS.PENDING,
    });

    oldCertificate.replacedBy = newCertificate._id;
    await oldCertificate.save();

    return newCertificate;
};

/**
 * Soft delete certificate: change status to OUTOFDATE
 */
export const softDeleteCertificateService = async (accountId, certificateId) => {
    const doctor = await getDoctorByAccountId(accountId);

    const certificate = await Certificate.findOne({ _id: certificateId, doctorId: doctor._id });
    if (!certificate) {
        const error = new Error("Certificate not found");
        error.statusCode = 404;
        throw error;
    }

    if (certificate.status === CERTIFICATE_STATUS.OUTOFDATE) {
        const error = new Error("Certificate is already deleted");
        error.statusCode = 400;
        throw error;
    }

    certificate.status = CERTIFICATE_STATUS.OUTOFDATE;
    await certificate.save();

    return certificate;
};

/**
 * Get all certificates for staff review (with pagination, filter, search)
 */
export const getAllCertificatesForStaffService = async (query) => {
    const { page, limit, status, search, sortBy, order } = query;
    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    let sortOption = { createdAt: -1 };
    if (sortBy) sortOption = { [sortBy]: order === "asc" ? 1 : -1 };

    const totalItems = await Certificate.countDocuments(filter);

    const certificates = await Certificate.find(filter)
        .populate("doctorId", "fullName")
        .populate("reviewedBy", "fullName")
        .sort(sortOption)
        .skip(offset)
        .limit(safeLimit);

    const pagination = getPaginationMetadata(certificates.length, totalItems, safeLimit, offset);
    return { data: certificates, metadata: pagination };
};

/**
 * Sale staff review certificate: approve or reject
 */
export const reviewCertificateService = async (certificateId, { action, note }, accountId) => {
    const certificate = await Certificate.findById(certificateId);
    const saleStaffId = await SaleStaff.findOne({ accountId }).select("_id");

    if (!certificate) {
        const error = new Error("Certificate not found");
        error.statusCode = 404;
        throw error;
    }

    if (certificate.status !== CERTIFICATE_STATUS.PENDING) {
        const error = new Error("Only PENDING certificates can be reviewed");
        error.statusCode = 400;
        throw error;
    }

    if (action === CERTIFICATE_STATUS.APPROVED) {
        certificate.status = CERTIFICATE_STATUS.APPROVED;
        certificate.reviewedBy = saleStaffId._id;
        certificate.reviewedAt = new Date();
        if (note) certificate.note = note;
        await certificate.save();

        const oldCertificate = await Certificate.findOne({ replacedBy: certificate._id });
        if (oldCertificate) {
            oldCertificate.status = CERTIFICATE_STATUS.OUTOFDATE;
            await oldCertificate.save();
        }
    } else if (action === CERTIFICATE_STATUS.REJECTED) {
        certificate.status = CERTIFICATE_STATUS.REJECTED;
        certificate.reviewedBy = saleStaffId._id;
        certificate.reviewedAt = new Date();
        if (note) certificate.note = note;
        await certificate.save();

        const oldCertificate = await Certificate.findOne({ replacedBy: certificate._id });
        if (oldCertificate) {
            oldCertificate.replacedBy = null;
            await oldCertificate.save();
        }
    } else {
        const error = new Error("Invalid action. Use 'APPROVED' or 'REJECTED'");
        error.statusCode = 400;
        throw error;
    }

    return certificate;
};