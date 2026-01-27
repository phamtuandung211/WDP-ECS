import express from "express";
import Appointment from "../models/Appointment.js";
import { authenticate } from "../middleware/auth.js";
import { validateAppointment } from "../utils/validators.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      query.customerId = req.user.id;
    }
    const appointments = await Appointment.find(query)
      .populate("customerId", "name email")
      .populate("serviceId", "name price")
      .populate("doctorId", "name");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { isValid, errors } = validateAppointment(req.body);
    if (!isValid) return res.status(400).json({ errors });

    const appointment = new Appointment({
      ...req.body,
      customerId: req.user.id,
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ message: "Failed to create appointment" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (
      appointment.customerId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update appointment" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (
      appointment.customerId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

export default router;
