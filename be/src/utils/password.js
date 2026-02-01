import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

export const hashOtp = async (otpCode) => {
  return bcrypt.hash(otpCode, SALT_ROUNDS);
};

export const compareOtp = async (otpCode, otpHash) => {
  return bcrypt.compare(otpCode, otpHash);
};
