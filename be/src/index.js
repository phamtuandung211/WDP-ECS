import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import swaggerDocument from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import { errorHandler, authenticate } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.route.js";
import rolesRoutes from "./routes/role.route.js";
import approvalRoutes from "./routes/approval.route.js";
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

dotenv.config();

const app = express();
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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes) 
app.use("/api/roles", rolesRoutes);
app.use("/api/approval", approvalRoutes);
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


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Swagger: http://localhost:${PORT}/api-docs`);
});
