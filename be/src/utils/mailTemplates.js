export const buildVerifyOtpMail = ({ otpCode, expiresAt }) => {
  const expireTime = new Date(expiresAt).toLocaleString();
  return {
    subject: "Verify your account",
    text: `Your OTP code is ${otpCode}. It expires at ${expireTime}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your account</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px;">${otpCode}</h1>
        <p>This code will expire at <strong>${expireTime}</strong>.</p>
      </div>
    `,
  };
};
