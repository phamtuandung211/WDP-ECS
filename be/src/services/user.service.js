import Account from "../models/Account.js";
import { PROFILE_MODEL_BY_ROLE } from "../constants/ProfileModel.enum.js";


function throwErr(status, message) {
    const err = new Error(message);
    err.status = status;
    throw err;
}


export const getProfileByAccountId = async ({ accountId, role }) => {
    const ProfileModel = PROFILE_MODEL_BY_ROLE[role];
    if (!ProfileModel) throwErr(403, "Invalid role");

    const account = await Account.findById(accountId)
        .select("email status isVerified createdAt")
        .lean();
    if (!account) throwErr(404, "Account not found");

    let profile = await ProfileModel.findOne({ accountId }).lean();


    if (!profile) throwErr(404, "Profile not found");

    return { ...profile, account };
};


export const updateProfileByAccountId = async ({ accountId, role, payload }) => {
    const ProfileModel = PROFILE_MODEL_BY_ROLE[role];
    if (!ProfileModel) throwErr(403, "Invalid role");
    const ALLOWED_FIELDS = ["fullName", "phone", "gender", "dateOfBirth", "address", "avatar"];
    const GENDER_ENUM = ["MALE", "FEMALE", "OTHER"];
    const errors = {};

    if (payload.fullName !== undefined) {
        if (typeof payload.fullName !== "string" || payload.fullName.trim().length < 2)
            errors.fullName = "fullName must be a string with at least 2 characters";
        else if (payload.fullName.trim().length > 100)
            errors.fullName = "fullName must not exceed 100 characters";
    }
    if (payload.phone !== undefined) {
        if (typeof payload.phone !== "string" || !/^\+?\d{9,15}$/.test(payload.phone.trim()))
            errors.phone = "phone must be a valid phone number (9–15 digits)";
    }
    if (payload.gender !== undefined) {
        if (!GENDER_ENUM.includes(payload.gender))
            errors.gender = `gender must be one of: ${GENDER_ENUM.join(", ")}`;
    }
    if (payload.dateOfBirth !== undefined) {
        const d = new Date(payload.dateOfBirth);
        if (isNaN(d.getTime()))
            errors.dateOfBirth = "dateOfBirth must be a valid date string";
        else if (d > new Date())
            errors.dateOfBirth = "dateOfBirth must not be in the future";
    }
    if (payload.address !== undefined) {
        if (typeof payload.address !== "string" || payload.address.trim().length === 0)
            errors.address = "address must be a non-empty string";
        else if (payload.address.trim().length > 300)
            errors.address = "address must not exceed 300 characters";
    }
    if (payload.avatar !== undefined) {
        try { new URL(payload.avatar); } catch {
            errors.avatar = "avatar must be a valid URL";
        }
    }

    if (Object.keys(errors).length > 0)
        throwErr(400, JSON.stringify({ message: "Validation failed", errors }));
    const updateData = {};
    for (const field of ALLOWED_FIELDS) {
        if (payload[field] !== undefined) {
            updateData[field] = payload[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        throwErr(400, "No valid fields to update");
    }

    const profile = await ProfileModel.findOneAndUpdate(
        { accountId },
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();

    if (!profile) throwErr(404, "Profile not found");

    return profile;
};
