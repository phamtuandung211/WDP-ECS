import validator from "validator";
import mongoose from "mongoose";
import Account from "../models/Account.js";
import Customer from "../models/Customer.js";
import Role from "../models/Role.js";
import SaleStaff from "../models/SaleStaff.js";
import CustomerSupport from "../models/CustomerSupport.js";
import Doctor from "../models/Doctor.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import { ACCOUNT_STATUS } from "../constants/Account.enum.js";
import { PROFILE_MODEL_BY_ROLE } from "../constants/ProfileModel.enum.js";
import {
  hashPassword,
  comparePassword,
  hashOtp,
  compareOtp,
} from "../utils/password.js";
import { generateOtpCode, getOtpExpiry } from "../utils/otp.js";
import { signAccessToken } from "../utils/jwt.js";
import { sendMail } from "../config/mail.js";
import { buildVerifyOtpMail } from "../utils/mailTemplates.js";
import { getAccountsWithProfiles } from "./account.service.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";

const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESEND = 3;
const OTP_RESEND_BLOCK_SECONDS = 60;
const RESEND_RESET_WINDOW = 3600 * 1000; // 1 hour in ms

export const registerCustomer = async ({
  email,
  password,
  fullName,
  phone,
  gender,
  dateOfBirth,
  address,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // validate
    const errors = {};
    if (!email || !validator.isEmail(email)) errors.email = "Invalid email";
    if (!password || password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!fullName || fullName.trim().length < 2)
      errors.fullName = "Invalid full name";
    if (!phone || phone.trim().length < 8) errors.phone = "Invalid phone";

    const normalizedGender = gender ? gender.toUpperCase() : undefined;
    if (normalizedGender && !["MALE", "FEMALE"].includes(normalizedGender)) {
      errors.gender = "Gender must be MALE or FEMALE";
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error("Validation failed");
      err.status = 400;
      err.data = errors;
      throw err;
    }

    // check existing
    const existing = await Account.findOne(
      { email: email.toLowerCase() },
      null,
      { session },
    );
    if (existing) {
      const err = new Error("Email already exists");
      err.status = 409;
      throw err;
    }

    const role = await Role.findOne({ name: ROLE_NAME.CUSTOMER }, null, {
      session,
    });

    const passwordHash = await hashPassword(password);

    // create account
    const account = new Account({
      email: email.toLowerCase(),
      passwordHash,
      role: role._id,
      isVerified: false,
      status: ACCOUNT_STATUS.ACTIVE,
      otpAttempts: 0,
      otpResendCount: 0,
    });
    await account.save({ session });

    // create customer profile
    const customer = new Customer({
      accountId: account._id,
      fullName,
      phone,
      gender: gender?.toUpperCase(),
      dateOfBirth,
      address,
    });
    await customer.save({ session });

    // generate OTP
    const otpCode = generateOtpCode();
    const otpCodeHash = await hashOtp(otpCode);
    const otpExpiredAt = getOtpExpiry(5);

    await Account.updateOne(
      { _id: account._id },
      {
        otpCodeHash,
        otpExpiredAt,
        otpAttempts: 0,
      },
      { session },
    );

    // commit DB
    await session.commitTransaction();
    session.endSession();

    // send mail AFTER commit
    const mail = buildVerifyOtpMail({
      otpCode,
      expiresAt: otpExpiredAt,
    });

    await sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    return { message: "Register success. Please verify OTP" };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const registerStaffByRole = async (
  email,
  password,
  staffRole,
  fullName,
  phone,
  gender,
  dateOfBirth,
  address,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // validate
    const errors = {};
    if (!email || !validator.isEmail(email)) errors.email = "Invalid email";
    if (!password || password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!fullName || fullName.trim().length < 2)
      errors.fullName = "Invalid full name";
    if (!phone || phone.trim().length < 8) errors.phone = "Invalid phone";

    const normalizedGender = gender ? gender.toUpperCase() : undefined;
    if (normalizedGender && !["MALE", "FEMALE"].includes(normalizedGender)) {
      errors.gender = "Gender must be MALE or FEMALE";
    }

    // validate staffRole
    const roleUpper = staffRole?.toUpperCase();
    if (
      !roleUpper ||
      ![
        ROLE_NAME.SALE_STAFF,
        ROLE_NAME.CUSTOMER_SUPPORT,
        ROLE_NAME.DOCTOR,
      ].includes(roleUpper)
    ) {
      errors.staffRole =
        "Staff role must be SALE_STAFF, CUSTOMER_SUPPORT or DOCTOR";
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error("Validation failed");
      err.status = 400;
      err.data = errors;
      throw err;
    }

    // check existing
    const existing = await Account.findOne(
      { email: email.toLowerCase() },
      null,
      { session },
    );
    if (existing) {
      const err = new Error("Email already exists");
      err.status = 409;
      throw err;
    }

    const roleObj = await Role.findOne({ name: roleUpper }, null, { session });
    if (!roleObj) {
      const err = new Error("Role not found");
      err.status = 400;
      throw err;
    }

    // create account
    const passwordHash = await hashPassword(password);
    const account = new Account({
      email: email.toLowerCase(),
      passwordHash,
      role: roleObj._id,
      isVerified: false,
      status: ACCOUNT_STATUS.PENDING,
    });

    await account.save({ session });

    // create profile based on role
    const profileData = {
      accountId: account._id,
      fullName,
      phone,
      gender: gender?.toUpperCase(),
      dateOfBirth,
      address,
    };

    if (roleUpper === ROLE_NAME.DOCTOR) {
      const doctor = new Doctor({
        ...profileData,
        experienceYears: 0,
        specializations: [],
      });
      await doctor.save({ session });
    } else if (roleUpper === ROLE_NAME.SALE_STAFF) {
      const saleStaff = new SaleStaff(profileData);
      await saleStaff.save({ session });
    } else if (roleUpper === ROLE_NAME.CUSTOMER_SUPPORT) {
      const customerSupport = new CustomerSupport(profileData);
      await customerSupport.save({ session });
    }

    // generate OTP
    const otpCode = generateOtpCode();
    const otpCodeHash = await hashOtp(otpCode);
    const otpExpiredAt = getOtpExpiry(5);

    await Account.updateOne(
      { _id: account._id },
      { otpCodeHash, otpExpiredAt, otpAttempts: 0 },
      { session },
    );

    // commit DB
    await session.commitTransaction();
    session.endSession();

    // send mail AFTER commit
    const mail = buildVerifyOtpMail({ otpCode, expiresAt: otpExpiredAt });

    await sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    return { message: "Register success. Please verify OTP" };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const verifyOtp = async ({ email, otpCode }) => {
  const errors = {};
  if (!email || !validator.isEmail(email)) errors.email = "Invalid email";
  if (!otpCode || otpCode.toString().trim().length !== 6) {
    errors.otpCode = "OTP code must be 6 digits";
  }
  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = errors;
    throw err;
  }

  const account = await Account.findOne({ email: email.toLowerCase() });
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }

  if (account.isVerified) {
    return { message: "Account already verified" };
  }

  if (!account.otpExpiredAt || !account.otpCodeHash) {
    const err = new Error("OTP not found. Please resend OTP");
    err.status = 400;
    throw err;
  }

  if (account.otpAttempts >= OTP_MAX_ATTEMPTS) {
    const err = new Error("Too many attempts. Please resend OTP");
    err.status = 429;
    throw err;
  }

  if (account.otpExpiredAt <= new Date()) {
    const err = new Error("OTP expired. Please resend OTP");
    err.status = 400;
    throw err;
  }

  const otpValid = await compareOtp(otpCode, account.otpCodeHash);
  if (!otpValid) {
    account.otpAttempts += 1;
    await account.save();
    const err = new Error("Invalid OTP");
    err.status = 400;
    throw err;
  }

  account.isVerified = true;
  account.otpCodeHash = undefined;
  account.otpExpiredAt = undefined;
  account.otpAttempts = 0;
  account.otpResendCount = 0;
  account.otpResendBlockedUntil = undefined;
  account.otpResendLastResetAt = undefined;
  await account.save();

  return { message: "OTP verified successfully" };
};

export const resendOtp = async ({ email }) => {
  const errors = {};
  if (!email || !validator.isEmail(email)) {
    errors.email = "Invalid email";
  }
  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = errors;
    throw err;
  }

  const account = await Account.findOne({ email: email.toLowerCase() });
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }

  if (account.isVerified) {
    return { message: "Account already verified" };
  }

  const now = new Date();

  if (
    account.otpResendLastResetAt &&
    now.getTime() - account.otpResendLastResetAt.getTime() > RESEND_RESET_WINDOW
  ) {
    account.otpResendCount = 0;
    account.otpResendBlockedUntil = undefined;
    account.otpResendLastResetAt = now;
  }

  // Check if currently blocked from resending
  if (account.otpResendBlockedUntil && account.otpResendBlockedUntil > now) {
    const waitSeconds = Math.ceil(
      (account.otpResendBlockedUntil.getTime() - now.getTime()) / 1000,
    );
    const err = new Error(`Please wait ${waitSeconds}s before resending OTP`);
    err.status = 429;
    throw err;
  }

  // Clear block if expired
  if (account.otpResendBlockedUntil && account.otpResendBlockedUntil <= now) {
    account.otpResendBlockedUntil = undefined;
    account.otpResendCount = 0;
    account.otpResendLastResetAt = now;
  }

  // Check if resend limit exceeded
  if (account.otpResendCount >= OTP_MAX_RESEND) {
    account.otpResendBlockedUntil = new Date(
      now.getTime() + OTP_RESEND_BLOCK_SECONDS * 1000,
    );
    await account.save();

    const err = new Error(
      `Too many resend attempts. Please wait ${OTP_RESEND_BLOCK_SECONDS}s`,
    );
    err.status = 429;
    throw err;
  }

  // Generate and send new OTP
  const otpCode = generateOtpCode();
  const otpCodeHash = await hashOtp(otpCode);
  const otpExpiredAt = getOtpExpiry(5);

  account.otpCodeHash = otpCodeHash;
  account.otpExpiredAt = otpExpiredAt;
  account.otpAttempts = 0;
  account.otpResendCount += 1;
  account.otpResendLastResetAt = account.otpResendLastResetAt || now;
  await account.save();

  // Send email (consider using a queue for reliability)
  const mail = buildVerifyOtpMail({ otpCode, expiresAt: otpExpiredAt });
  await sendMail({
    to: account.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  const result = { message: "OTP resent successfully" };
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.SHOW_OTP === "true"
  ) {
    // For development/testing only: include OTP in response so frontend can log it
    result.otp = otpCode;
  }
  return result;
};

export const loginService = async ({ email, password }) => {
  const errors = {};
  if (!email || !validator.isEmail(email)) errors.email = "Invalid email";
  if (!password) errors.password = "Password is required";
  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = errors;
    throw err;
  }

  const account = await Account.findOne({
    email: email.toLowerCase(),
  }).populate("role");
  if (!account) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  if (!account.isVerified) {
    const err = new Error("Account not verified");
    err.status = 403;
    throw err;
  }

  if (
    ![ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.REJECTED].includes(account.status)
  ) {
    const err = new Error(
      account.status === ACCOUNT_STATUS.SUSPENDED
        ? "Account is suspended"
        : "Account is pending approval",
    );
    err.status = 403;
    throw err;
  }

  const passwordValid = await comparePassword(password, account.passwordHash);
  if (!passwordValid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const roleName = account.role?.name || ROLE_NAME.CUSTOMER;
  const accessToken = signAccessToken({
    accountId: account._id,
    status: account.status,
    role: roleName,
  });

  return { accessToken };
};

//Get pending accounts by filter
export const getPendingAccountsByFilter = async ({
  roles,
  status,
  page,
  limit,
}) => {
  // Normalize roles to array
  const rolesArray = roles ? (Array.isArray(roles) ? roles : [roles]) : null;

  // ===== validate =====
  if (rolesArray) {
    for (const role of rolesArray) {
      if (!Object.values(ROLE_NAME).includes(role)) {
        const err = new Error(
          `Role must be one of: ${ROLE_NAME.SALE_STAFF}, ${ROLE_NAME.CUSTOMER_SUPPORT},${ROLE_NAME.DOCTOR}`,
        );
        err.status = 400;
        throw err;
      }
    }
  }

  if (status && !Object.values(ACCOUNT_STATUS).includes(status)) {
    const err = new Error("Invalid account status filter");
    err.status = 400;
    throw err;
  }

  // ===== build query =====
  const query = {};
  if (status) query.status = status;

  if (rolesArray && rolesArray.length > 0) {
    const roleDocs = await Role.find({ name: { $in: rolesArray } }).select(
      "_id name",
    );
    const { limit: safeLimit, offset } = buildPagination({ page, limit });

    if (roleDocs.length === 0) {
      return {
        data: [],
        metadata: getPaginationMetadata(0, 0, safeLimit, offset),
      };
    }

    const roleIds = roleDocs.map((r) => r._id);
    query.role = rolesArray.length === 1 ? roleIds[0] : { $in: roleIds };
  }

  // ===== use generic function =====
  const result = await getAccountsWithProfiles({
    query,
    roleNames: rolesArray,
    page,
    limit,
  });

  // Transform data to match expected format
  const data = result.data.map((acc) => ({
    _id: acc._id,
    email: acc.email,
    role: acc.role?.name,
    status: acc.status,
    isVerified: acc.isVerified,
    createdAt: acc.createdAt,
    profile: acc.profile,
  }));

  return {
    data,
    metadata: result.metadata,
  };
};

export const approveAccount = async ({ accountId, actorId, actorRole }) => {
  const account = await Account.findById(accountId).populate("role");
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }

  if (account.status !== ACCOUNT_STATUS.PENDING) {
    const err = new Error("Account is not in pending state");
    err.status = 400;
    throw err;
  }

  const targetRole = account.role?.name;

  // ===== RULE CHECK =====
  if (
    actorRole === ROLE_NAME.ADMIN &&
    ![ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT].includes(targetRole)
  ) {
    const err = new Error("Admin cannot approve this role");
    err.status = 403;
    throw err;
  }

  if (
    actorRole === ROLE_NAME.CUSTOMER_SUPPORT &&
    targetRole !== ROLE_NAME.DOCTOR
  ) {
    const err = new Error("Customer Support can only approve doctor");
    err.status = 403;
    throw err;
  }

  // ===== UPDATE ACCOUNT =====
  account.status = ACCOUNT_STATUS.ACTIVE;
  account.updatedAt = new Date();
  account.rejectionReason = undefined;
  await account.save();

  // ===== UPDATE PROFILE =====
  const ProfileModel = PROFILE_MODEL_BY_ROLE[targetRole];
  if (ProfileModel) {
    await ProfileModel.findOneAndUpdate(
      { accountId },
      { approvedBy: actorId, rejectedBy: null },
    );
  }
};

export const rejectAccount = async ({
  accountId,
  actorId,
  actorRole,
  rejectionReason,
}) => {
  const account = await Account.findById(accountId).populate("role");
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }

  if (account.status !== ACCOUNT_STATUS.PENDING) {
    const err = new Error("Account is not in pending state");
    err.status = 400;
    throw err;
  }

  const targetRole = account.role?.name;

  // ===== RULE CHECK =====
  if (
    actorRole === ROLE_NAME.ADMIN &&
    ![ROLE_NAME.SALE_STAFF, ROLE_NAME.CUSTOMER_SUPPORT].includes(targetRole)
  ) {
    const err = new Error("Admin cannot reject this role");
    err.status = 403;
    throw err;
  }

  if (
    actorRole === ROLE_NAME.CUSTOMER_SUPPORT &&
    targetRole !== ROLE_NAME.DOCTOR
  ) {
    const err = new Error("Customer Support can only reject doctor");
    err.status = 403;
    throw err;
  }

  // ===== UPDATE ACCOUNT =====
  account.status = ACCOUNT_STATUS.REJECTED;
  account.rejectionReason = rejectionReason || null;
  account.updatedAt = new Date();
  await account.save();

  // ===== UPDATE PROFILE =====
  const ProfileModel = PROFILE_MODEL_BY_ROLE[targetRole];
  if (ProfileModel) {
    await ProfileModel.findOneAndUpdate({ accountId }, { rejectedBy: actorId });
  }

  return { message: "Account rejected successfully" };
};

export const updateProfileAfterRejection = async ({ accountId, payload }) => {
  const account = await Account.findById(accountId).populate("role");
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }

  if (account.status !== ACCOUNT_STATUS.REJECTED) {
    const err = new Error("Only rejected accounts can update profile");
    err.status = 400;
    throw err;
  }

  if (!payload || Object.keys(payload).length === 0) {
    const err = new Error("No data to update");
    err.status = 400;
    throw err;
  }

  const roleName = account.role?.name;
  const ProfileModel = PROFILE_MODEL_BY_ROLE[roleName];

  if (!ProfileModel) {
    const err = new Error("Profile model not found");
    err.status = 500;
    throw err;
  }

  await ProfileModel.findOneAndUpdate({ accountId }, payload);

  return payload;
};

export const resubmitForApproval = async ({ accountId }) => {
  const account = await Account.findById(accountId);
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }

  if (account.status !== ACCOUNT_STATUS.REJECTED) {
    const err = new Error("Only rejected accounts can resubmit");
    err.status = 400;
    throw err;
  }

  account.status = ACCOUNT_STATUS.PENDING;
  account.rejectionReason = null;
  account.updatedAt = new Date();

  await account.save();

  return {
    accountId: account._id,
    status: account.status,
  };
};
