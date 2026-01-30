import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import { errorHandler, authenticate } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js";
import appointmentsRoutes from "./routes/appointments.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());
connectDB();

app.get("/", (req, res) => {
  res.json({ ok: true, message: "WDP-ECS API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/appointments", appointmentsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
});
