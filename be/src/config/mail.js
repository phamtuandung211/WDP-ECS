import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const mailHost = process.env.MAIL_HOST;
const mailPort = Number(process.env.MAIL_PORT || 587);
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

if (!mailHost || !mailUser || !mailPass) {
  console.warn(
    "MAIL config missing. Please set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS",
  );
}

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: mailPort === 465,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

export const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: mailUser,
    to,
    subject,
    html,
    text,
  });
};

export default transporter;
