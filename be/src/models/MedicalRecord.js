import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    diagnosis: String,
    prescription: String,
    notes: String,
    followUpDate: Date,
  },
  { timestamps: true },
);

export default mongoose.model("MedicalRecord", medicalRecordSchema);
