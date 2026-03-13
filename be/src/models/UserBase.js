import mongoose from "mongoose";

const userBaseSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true },
    phone: { type: String, required: false },
    gender: { type: String, enum: ["MALE", "FEMALE"] },
    dateOfBirth: Date,
    address: String,
    avatar: String,
  },
  { _id: false },
);

export default userBaseSchema;
