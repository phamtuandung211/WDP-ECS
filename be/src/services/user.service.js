import Account from "../models/Account.js";
import { PROFILE_MODEL_BY_ROLE } from "../constants/ProfileModel.enum.js";
import { ROLE_NAME } from "../constants/Role.enum.js";

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

    
    if (!profile) {
        const ROLES_WITH_AUTO_CREATE = [ROLE_NAME.ADMIN];
        if (ROLES_WITH_AUTO_CREATE.includes(role)) {
            profile = await ProfileModel.findOneAndUpdate(
                { accountId },
                { $setOnInsert: { accountId, fullName: account.email, phone: "N/A" } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).lean();
        } else {
            throwErr(404, "Profile not found");
        }
    }

    return { ...profile, account };
};


export const updateProfileByAccountId = async ({ accountId, role, payload }) => {
    const ProfileModel = PROFILE_MODEL_BY_ROLE[role];
    if (!ProfileModel) throwErr(403, "Invalid role");

    const ALLOWED_FIELDS = ["fullName", "phone", "gender", "dateOfBirth", "address", "avatar"];
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
