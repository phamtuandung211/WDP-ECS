import express from "express";
import Service from "../models/Service.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sale") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ message: "Failed to create service" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sale") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: "Failed to update service" });
  }
});

export default router;
