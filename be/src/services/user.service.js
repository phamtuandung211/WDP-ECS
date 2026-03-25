import Account from "../models/Account.js";
import { PROFILE_MODEL_BY_ROLE } from "../constants/ProfileModel.enum.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { getAccountsWithProfiles } from "./account.service.js";
import Role from "../models/Role.js";
import { ACCOUNT_STATUS } from "../constants/Account.enum.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";

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

export const updateProfileByAccountId = async ({
  accountId,
  role,
  payload,
}) => {
  const ProfileModel = PROFILE_MODEL_BY_ROLE[role];
  if (!ProfileModel) throwErr(403, "Invalid role");
  const ALLOWED_FIELDS = [
    "fullName",
    "phone",
    "gender",
    "dateOfBirth",
    "address",
    "avatar",
  ];
  const GENDER_ENUM = ["MALE", "FEMALE", "OTHER"];
  const errors = {};

  if (payload.fullName !== undefined) {
    if (
      typeof payload.fullName !== "string" ||
      payload.fullName.trim().length < 2
    )
      errors.fullName = "fullName must be a string with at least 2 characters";
    else if (payload.fullName.trim().length > 100)
      errors.fullName = "fullName must not exceed 100 characters";
  }
  if (payload.phone !== undefined) {
    if (
      typeof payload.phone !== "string" ||
      !/^\+?\d{9,15}$/.test(payload.phone.trim())
    )
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
    if (
      typeof payload.address !== "string" ||
      payload.address.trim().length === 0
    )
      errors.address = "address must be a non-empty string";
    else if (payload.address.trim().length > 300)
      errors.address = "address must not exceed 300 characters";
  }
  if (payload.avatar !== undefined) {
    try {
      new URL(payload.avatar);
    } catch {
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
    { new: true, runValidators: true },
  ).lean();

  if (!profile) throwErr(404, "Profile not found");

  return profile;
};

export const changePasswordByAccountId = async ({
  accountId,
  oldPassword,
  newPassword,
}) => {
  if (typeof newPassword !== "string" || newPassword.length < 6)
    throwErr(400, "newPassword must be a string with at least 6 characters");

  const account = await Account.findById(accountId);
  if (!account) throwErr(404, "Account not found");
  const isMatch = await comparePassword(oldPassword, account.passwordHash);
  if (!isMatch) throwErr(400, "Current password is incorrect");

  const newPasswordHash = await hashPassword(newPassword);
  account.passwordHash = newPasswordHash;
  await account.save();
  return;
};

export const getAccountsForAdmin = async ({
  page,
  limit,
  status,
  role,
  search,
}) => {
  const query = {};

  if (status && status !== "ALL") {
    if (!Object.values(ACCOUNT_STATUS).includes(status)) {
      throwErr(400, "Invalid account status");
    }
    query.status = status;
  }

  if (search?.trim()) {
    query.email = { $regex: search.trim(), $options: "i" };
  }

  if (role && role !== "ALL") {
    if (!Object.values(ROLE_NAME).includes(role)) {
      throwErr(400, "Invalid role");
    }
    const roleDoc = await Role.findOne({ name: role }).select("_id").lean();
    if (!roleDoc) {
      const { limit: safeLimit, offset } = buildPagination({ page, limit });
      return {
        data: [],
        metadata: getPaginationMetadata(0, 0, safeLimit, offset),
      };
    }
    query.role = roleDoc._id;
  }

  const result = await getAccountsWithProfiles({
    query,
    roleNames: Object.values(ROLE_NAME),
    page,
    limit,
  });

  return {
    data: result.data.map((acc) => ({
      _id: acc._id,
      email: acc.email,
      status: acc.status,
      isVerified: acc.isVerified,
      createdAt: acc.createdAt,
      role: acc.role,
      fullName: acc.profile?.fullName || null,
      phone: acc.profile?.phone || null,
    })),
    metadata: result.metadata,
  };
};

export const updateAccountStatusByAdmin = async ({
  accountId,
  status,
  requesterAccountId,
}) => {
  if (!Object.values(ACCOUNT_STATUS).includes(status)) {
    throwErr(400, "Invalid account status");
  }

  if (
    String(accountId) === String(requesterAccountId) &&
    status !== ACCOUNT_STATUS.ACTIVE
  ) {
    throwErr(400, "You cannot deactivate your own account");
  }

  const updated = await Account.findByIdAndUpdate(
    accountId,
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .select("_id email role status isVerified createdAt")
    .populate("role", "name")
    .lean();

  if (!updated) {
    throwErr(404, "Account not found");
  }

  return updated;
};
