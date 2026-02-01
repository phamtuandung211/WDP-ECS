import mongoose from "mongoose";
import userBaseSchema from "./UserBase.js";

const adminSchema = new mongoose.Schema({}, { timestamps: true, _id: true });

adminSchema.add(userBaseSchema);

export default mongoose.model("Admin", adminSchema);
