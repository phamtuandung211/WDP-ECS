import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    point: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerSupport",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Feedback", feedbackSchema);
