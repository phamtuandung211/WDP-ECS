import mongoose from "mongoose";
const medicalRecordSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    prescription: { type: String, required: true },
    notes: String,
    aiSummary: String,
  },
  { timestamps: true },
);

export default mongoose.model("MedicalRecord", medicalRecordSchema);
