export const buildVerifyOtpMail = ({ otpCode, expiresAt }) => {
  const expireTime = new Date(expiresAt).toLocaleString("vi-VN");

  return {
    subject: "Xác minh tài khoản của bạn",
    text: `
Mã OTP của bạn là: ${otpCode}

Mã này sẽ hết hạn vào: ${expireTime}

Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
    `,
    html: `
      <div style="
        font-family: Arial, Helvetica, sans-serif;
        background-color: #f5f7fb;
        padding: 24px;
      ">
        <div style="
          max-width: 520px;
          margin: auto;
          background: #ffffff;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        ">

          <h2 style="margin-top: 0; color: #222;">
            Xác minh tài khoản
          </h2>

          <p style="color: #555;">
            Chúng tôi nhận được yêu cầu xác minh tài khoản của bạn.
            Vui lòng sử dụng mã OTP bên dưới để tiếp tục:
          </p>

          <div style="
            text-align: center;
            margin: 24px 0;
          ">
            <span style="
              display: inline-block;
              background: #f0f4ff;
              color: #1a3cff;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 6px;
              padding: 12px 24px;
              border-radius: 6px;
            ">
              ${otpCode}
            </span>
          </div>

          <p style="color: #555;">
            Mã này sẽ hết hạn vào
            <strong>${expireTime}</strong>.
          </p>

          <p style="color: #888; font-size: 13px;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
            Vì lý do bảo mật, không chia sẻ mã OTP cho bất kỳ ai.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} EyeCare. All rights reserved.
          </p>

        </div>
      </div>
    `,
  };
};
