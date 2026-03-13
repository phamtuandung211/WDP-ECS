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
import { OAuth2Client } from "google-auth-library";

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
      isVerified: true,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    await account.save({ session });

    // create profile based on role
    const profileData = {
      accountId: account._id,
      fullName,
    };

    if (roleUpper === ROLE_NAME.SALE_STAFF) {
      const saleStaff = new SaleStaff(profileData);
      await saleStaff.save({ session });
    } else if (roleUpper === ROLE_NAME.CUSTOMER_SUPPORT) {
      const customerSupport = new CustomerSupport(profileData);
      await customerSupport.save({ session });
    } else {
      const doctor = new Doctor({
        ...profileData,
        experienceYears: 0,
        specializations: [],
      });
      await doctor.save({ session });
    }

    // commit DB
    await session.commitTransaction();
    session.endSession();

    return { message: "Staff account created successfully" };
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

  if (account.status !== ACCOUNT_STATUS.ACTIVE) {
    const err = new Error(
      account.status === ACCOUNT_STATUS.SUSPENDED
        ? "Account is suspended"
        : "Account is inactive",
    );
    err.status = 403;
    throw err;
  }

  if (!account.passwordHash) {
    const err = new Error(
      "This account uses Google login. Please sign in with Google.",
    );
    err.status = 400;
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

export const googleAuthService = async ({ idToken }) => {
  if (!idToken) {
    const err = new Error("Google idToken is required");
    err.status = 400;
    throw err;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error("Google OAuth is not configured");
    err.status = 500;
    throw err;
  }

  const client = new OAuth2Client(clientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    const err = new Error("Invalid Google token");
    err.status = 401;
    throw err;
  }

  const { sub: googleId, email, name, picture } = payload;

  if (!email) {
    const err = new Error("Google account does not have an email");
    err.status = 400;
    throw err;
  }

  // Check if account already exists by googleId or email
  let account = await Account.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  }).populate("role");

  if (account) {
    // Existing account — check if it's a customer role
    const roleName = account.role?.name;
    if (roleName !== ROLE_NAME.CUSTOMER) {
      const err = new Error("Google login is only available for customers");
      err.status = 403;
      throw err;
    }

    if (account.status === ACCOUNT_STATUS.SUSPENDED) {
      const err = new Error("Account is suspended");
      err.status = 403;
      throw err;
    }

    // Link googleId if account was created via email but not yet linked
    if (!account.googleId) {
      account.googleId = googleId;
      account.authProvider = "google";
    }

    // Auto-verify if not yet verified (Google already verified the email)
    if (!account.isVerified) {
      account.isVerified = true;
      account.otpCodeHash = undefined;
      account.otpExpiredAt = undefined;
      account.otpAttempts = 0;
      account.otpResendCount = 0;
      account.otpResendBlockedUntil = undefined;
      account.otpResendLastResetAt = undefined;
    }

    await account.save();

    const accessToken = signAccessToken({
      accountId: account._id,
      status: account.status,
      role: roleName,
    });

    return { accessToken, isNewUser: false };
  }

  // New user — register as Customer
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const role = await Role.findOne({ name: ROLE_NAME.CUSTOMER }, null, {
      session,
    });

    account = new Account({
      email: email.toLowerCase(),
      googleId,
      authProvider: "google",
      role: role._id,
      isVerified: true,
      status: ACCOUNT_STATUS.ACTIVE,
    });
    await account.save({ session });

    const customer = new Customer({
      accountId: account._id,
      fullName: name || "Google User",
      phone: "N/A",
      avatar: picture || undefined,
    });
    await customer.save({ session });

    await session.commitTransaction();
    session.endSession();

    const accessToken = signAccessToken({
      accountId: account._id,
      status: account.status,
      role: ROLE_NAME.CUSTOMER,
    });

    return { accessToken, isNewUser: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
