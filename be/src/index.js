import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler, authenticate } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.route.js";
import rolesRoutes from "./routes/role.route.js";
import approvalRoutes from "./routes/approval.route.js";
import appointmentRoutes from "./routes/appointment.route.js";
import paymentRoutes from "./routes/payment.route.js";
import slotRoutes from "./routes/slot.route.js";
import { registerCronJobs } from "./cron/index.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/approval", approvalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/slots", slotRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
});
