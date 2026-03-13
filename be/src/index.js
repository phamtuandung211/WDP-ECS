import express from "express";
import http from "http";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { errorHandler } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.route.js";
import rolesRoutes from "./routes/role.route.js";
import manageServiceRoutes from "./routes/manageService.route.js";
import serviceRoutes from "./routes/service.route.js";
import manageBlogRoutes from "./routes/manageBlog.route.js";
import blogRoutes from "./routes/blog.route.js";
import appointmentRoutes from "./routes/appointment.route.js";
import paymentRoutes from "./routes/payment.route.js";
import slotRoutes from "./routes/slot.route.js";
import { registerCronJobs } from "./cron/index.js";
import doctorRoutes from "./routes/doctor.route.js";
import specializationRoutes from "./routes/specialization.route.js";
import userRoutes from "./routes/user.route.js";
import medicalRecordRoutes from "./routes/medicalRecord.route.js";
import feedbackRoutes from "./routes/feedback.route.js";
import statisticsRoutes from "./routes/statistics.route.js";
import uploadRoutes from "./routes/upload.route.js";
import degreeRoutes from "./routes/degree.route.js";
import certificateRoutes from "./routes/certificate.route.js";
import chatRoutes from "./routes/chat.route.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(cors());

app.use(express.json());
connectDB();

// Register cron jobs after DB connection
registerCronJobs();

app.get("/", (req, res) => {
  res.json({ ok: true, message: "WDP-ECS API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/manage-services", manageServiceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/manage-blogs", manageBlogRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/degrees", degreeRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/chat", chatRoutes);

app.use(errorHandler);

// Initialise Socket.IO for real-time chat
initSocket(server);

server.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Socket.IO ready`);
});
