import mongoose from "mongoose";
import {
  CHAT_MODE,
  CHAT_STATUS,
  MESSAGE_SENDER,
} from "../constants/Chat.enum.js";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: Object.values(MESSAGE_SENDER),
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerSupport",
      default: null,
    },
  },
  { timestamps: true },
);

const chatSessionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    mode: {
      type: String,
      enum: Object.values(CHAT_MODE),
      default: CHAT_MODE.AI_MODE,
    },
    status: {
      type: String,
      enum: Object.values(CHAT_STATUS),
      default: CHAT_STATUS.ACTIVE,
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerSupport",
      default: null,
    },
    messages: [messageSchema],
  },
  { timestamps: true },
);

chatSessionSchema.index({ customerId: 1, status: 1 });
chatSessionSchema.index({ assignedStaffId: 1, status: 1 });
chatSessionSchema.index({ mode: 1, status: 1 });

export default mongoose.model("ChatSession", chatSessionSchema);
