import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import swaggerDocument from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import { errorHandler, authenticate } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.route.js";
import rolesRoutes from "./routes/role.route.js";
import approvalRoutes from "./routes/approval.route.js";

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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/approval", approvalRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
  console.log(`✓ Swagger: http://localhost:${PORT}/api-docs`);
});
