import validator from "validator";
import Account from "../models/Account.js";
import Customer from "../models/Customer.js";
import Role from "../models/Role.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
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

const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESEND = 3;
const OTP_RESEND_BLOCK_SECONDS = 60;

const ensureCustomerRole = async () => {
  let role = await Role.findOne({ name: ROLE_NAME.CUSTOMER });
  if (!role) {
    role = await Role.create({ name: ROLE_NAME.CUSTOMER });
  }
  return role;
};

export const registerCustomer = async ({
  email,
  password,
  fullName,
  phone,
  gender,
  dateOfBirth,
  address,
}) => {
  const errors = {};
  if (!email || !validator.isEmail(email)) errors.email = "Invalid email";
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = "Invalid full name";
  }
  if (!phone || phone.trim().length < 8) {
    errors.phone = "Invalid phone";
  }
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

  const existing = await Account.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email already exists");
    err.status = 409;
    throw err;
  }

  const role = await ensureCustomerRole();
  const passwordHash = await hashPassword(password);

  const account = await Account.create({
    email: email.toLowerCase(),
    passwordHash,
    role: role._id,
    isVerified: false,

    otpAttempts: 0,
    otpResendCount: 0,
  });

  await Customer.create({
    accountId: account._id,
    fullName,
    phone,
    gender: normalizedGender,
    dateOfBirth,
    address,
  });

  const otpCode = generateOtpCode();
  const otpCodeHash = await hashOtp(otpCode);
  const otpExpiredAt = getOtpExpiry(5);

  account.otpCodeHash = otpCodeHash;
  account.otpExpiredAt = otpExpiredAt;
  account.otpAttempts = 0;
  await account.save();

  const mail = buildVerifyOtpMail({ otpCode, expiresAt: otpExpiredAt });
  await sendMail({
    to: account.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return { message: "Register success. Please verify OTP" };
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
  await account.save();

  return { message: "OTP verified successfully" };
};

export const resendOtp = async ({ email }) => {
  const emailErrors = {};
  if (!email || !validator.isEmail(email)) emailErrors.email = "Invalid email";
  if (Object.keys(emailErrors).length > 0) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = emailErrors;
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
  if (account.otpResendBlockedUntil && account.otpResendBlockedUntil > now) {
    const waitSeconds = Math.ceil(
      (account.otpResendBlockedUntil.getTime() - now.getTime()) / 1000,
    );
    const err = new Error(`Please wait ${waitSeconds}s before resending OTP`);
    err.status = 429;
    throw err;
  }

  if (account.otpResendCount >= OTP_MAX_RESEND) {
    account.otpResendBlockedUntil = new Date(
      Date.now() + OTP_RESEND_BLOCK_SECONDS * 1000,
    );
    await account.save();
    const err = new Error(
      `Please wait ${OTP_RESEND_BLOCK_SECONDS}s before resending OTP`,
    );
    err.status = 429;
    throw err;
  }

  const otpCode = generateOtpCode();
  const otpCodeHash = await hashOtp(otpCode);
  const otpExpiredAt = getOtpExpiry(5);

  account.otpCodeHash = otpCodeHash;
  account.otpExpiredAt = otpExpiredAt;
  account.otpAttempts = 0;
  account.otpResendCount += 1;
  account.otpResendBlockedUntil = undefined;
  await account.save();

  const mail = buildVerifyOtpMail({ otpCode, expiresAt: otpExpiredAt });
  await sendMail({
    to: account.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return { message: "OTP resent successfully" };
};

export const loginCustomer = async ({ email, password }) => {
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

  const passwordValid = await comparePassword(password, account.passwordHash);
  if (!passwordValid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const roleName = account.role?.name || ROLE_NAME.CUSTOMER;
  const accessToken = signAccessToken({
    accountId: account._id,
    role: roleName,
  });

  return { accessToken };
};
