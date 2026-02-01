import {
  registerCustomer,
  verifyOtp,
  resendOtp,
  loginCustomer,
} from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, gender, dateOfBirth, address } =
      req.body;

    const result = await registerCustomer({
      email,
      password,
      fullName,
      phone,
      gender,
      dateOfBirth,
      address,
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Register failed",
      errors: err.data,
    });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    const result = await verifyOtp({ email, otpCode });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Verify OTP failed",
      errors: err.data,
    });
  }
};

export const resendOtpController = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await resendOtp({ email });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Resend OTP failed",
      errors: err.data,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginCustomer({ email, password });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Login failed",
      errors: err.data,
    });
  }
};
