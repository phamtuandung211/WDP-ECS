export const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOtpExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
