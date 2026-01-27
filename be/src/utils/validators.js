import validator from "validator";

export const validateEmail = (email) => validator.isEmail(email);

export const validatePassword = (password) => password && password.length >= 6;

export const validateRegister = (data) => {
  const errors = {};
  if (!data.email || !validateEmail(data.email)) errors.email = "Invalid email";
  if (!data.password || !validatePassword(data.password)) {
    errors.password = "Password must be at least 6 characters";
  }
  if (!data.name || data.name.trim().length < 2) errors.name = "Invalid name";
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateAppointment = (data) => {
  const errors = {};
  if (!data.serviceId) errors.serviceId = "Service required";
  if (!data.date) errors.date = "Date required";
  if (!data.time) errors.time = "Time required";
  return { isValid: Object.keys(errors).length === 0, errors };
};
