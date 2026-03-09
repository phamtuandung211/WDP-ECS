import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatSession from "../models/ChatSession.js";
import Customer from "../models/Customer.js";
import CustomerSupport from "../models/CustomerSupport.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Service from "../models/Service.js";
import {
  CHAT_MODE,
  CHAT_STATUS,
  MESSAGE_SENDER,
} from "../constants/Chat.enum.js";
import { APPOINTMENT_STATUS } from "../constants/Appointment.enum.js";
import { buildPagination, getPaginationMetadata } from "../utils/pagination.js";
import dotenv from "dotenv";
dotenv.config();
// ─── Helpers ────────────────────────────────────────────────────────

function throwErr(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

// ─── AI System Prompt ───────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `Bạn là trợ lý AI của phòng khám mắt EyesCare.

NGUYÊN TẮC:
1. Không bịa thông tin.
2. Không tự tạo lịch hẹn.
3. Không tự tạo dữ liệu bệnh nhân.
4. Chỉ sử dụng thông tin trong SYSTEM_DATA được cung cấp.
5. Nếu câu hỏi cần dữ liệu cá nhân mà không có SYSTEM_DATA thì yêu cầu kiểm tra hệ thống.
6. Không chẩn đoán bệnh.
7. Không kê đơn thuốc.

Bạn có thể:
- Giải thích chung về triệu chứng mắt.
- Khuyên nên đến khám.
- Hướng dẫn đặt lịch.
- Giải thích quy trình khám.

PHONG CÁCH: Lịch sự, rõ ràng, tự nhiên. Không dùng emoji. Tối đa 5-7 câu.
Không nhắc đến SYSTEM_DATA trong câu trả lời.

Nếu không chắc chắn, trả lời:
"Tôi chưa có đủ thông tin để trả lời chính xác. Tôi sẽ kết nối bạn với nhân viên hỗ trợ."

Nếu khách yêu cầu gặp nhân viên, tức giận, khiếu nại, hoặc câu hỏi ngoài phạm vi, chỉ trả lời:
"Tôi sẽ kết nối bạn với nhân viên hỗ trợ ngay bây giờ."`;

const SUPPORT_SYSTEM_PROMPT = `Bạn là nhân viên chăm sóc khách hàng của phòng khám mắt EyesCare.

NGUYÊN TẮC:
1. Lịch sự và chuyên nghiệp.
2. Có thể xử lý chi tiết hơn AI thông thường.
3. Có thể xin lỗi khách nếu có sự cố.
4. Không chẩn đoán bệnh.
5. Không kê đơn thuốc.
6. Không nói rằng bạn là AI.

Nếu khách tức giận: thể hiện sự thấu hiểu, xin lỗi, đưa giải pháp cụ thể, không tranh luận.

Bạn có thể:
- Giải thích chung về triệu chứng.
- Khuyên nên đến khám.

PHONG CÁCH: Lịch sự, rõ ràng, tự nhiên. Không dùng emoji. Tối đa 5-7 câu.
Không nhắc đến SYSTEM_DATA trong câu trả lời.`;

// ─── Build SYSTEM_DATA context ──────────────────────────────────────

async function buildSystemData(customerId) {
  const data = {};

  // Customer info
  const customer = await Customer.findById(customerId)
    .select("fullName phone gender dateOfBirth address")
    .lean();
  if (customer) {
    data.customer_name = customer.fullName;
    data.customer_phone = customer.phone;
  }

  // Upcoming appointments
  const appointments = await Appointment.find({
    customerId,
    status: {
      $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING_PAYMENT],
    },
  })
    .populate("doctorId", "fullName")
    .populate("slotId", "date startTime endTime")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  if (appointments.length > 0) {
    data.appointments = appointments.map((a) => ({
      type: a.type,
      status: a.status,
      desiredDate: a.desiredDate,
      doctor: a.doctorId?.fullName || null,
      slot: a.slotId
        ? {
            date: a.slotId.date,
            startTime: a.slotId.startTime,
            endTime: a.slotId.endTime,
          }
        : null,
      note: a.note,
    }));
  }

  // Available doctors
  const doctors = await Doctor.find()
    .populate("specializations", "name")
    .select("fullName specializations experienceYears")
    .lean();

  if (doctors.length > 0) {
    data.doctors = doctors.map((d) => ({
      name: d.fullName,
      specializations: d.specializations?.map((s) => s.name) || [],
      experienceYears: d.experienceYears,
    }));
  }

  // Services
  const services = await Service.find().select("name description price").lean();
  if (services.length > 0) {
    data.services = services.map((s) => ({
      name: s.name,
      description: s.description,
      price: s.price,
    }));
  }

  // Clinic general info
  data.address = process.env.CLINIC_ADDRESS || "Phòng khám mắt EyesCare";
  data.working_hours =
    process.env.CLINIC_WORKING_HOURS || "8:00 - 17:00, Thứ 2 - Thứ 7";

  return data;
}

// ─── Generate AI response (Gemini) ──────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function generateAIResponse(systemPrompt, systemData, messages) {
  try {
    const systemInstruction = `${systemPrompt}\n\nSYSTEM_DATA:\n${JSON.stringify(systemData, null, 2)}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    // Build conversation history for Gemini
    const history = messages.map((m) => ({
      role: m.sender === MESSAGE_SENDER.CUSTOMER ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // The last message is the user's latest input — pop it to use as sendMessage
    const lastMessage = history.pop();

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline để được hỗ trợ.";
  }
}

// ─── Detect if transfer to staff is needed ──────────────────────────

const TRANSFER_KEYWORDS = [
  "gặp nhân viên",
  "nói chuyện với người",
  "hỗ trợ trực tiếp",
  "khiếu nại",
  "tức giận",
  "không hài lòng",
  "phản hồi xấu",
  "hoàn tiền",
  "trả tiền",
];

function shouldTransferToStaff(content) {
  const lower = content.toLowerCase();
  return TRANSFER_KEYWORDS.some((kw) => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════════════
// Service functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Start or resume an active chat session for a customer.
 * If an active session exists, return it. Otherwise create a new one.
 */
export async function startOrResumeSession(customerId) {
  let session = await ChatSession.findOne({
    customerId,
    status: CHAT_STATUS.ACTIVE,
  });

  if (session) {
    return session;
  }

  session = await ChatSession.create({
    customerId,
    mode: CHAT_MODE.AI_MODE,
    status: CHAT_STATUS.ACTIVE,
    messages: [],
  });

  return session;
}

/**
 * Customer sends a message in AI_MODE.
 * The AI generates a reply automatically.
 */
export async function sendCustomerMessage(sessionId, customerId, content) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    customerId,
    status: CHAT_STATUS.ACTIVE,
  });

  if (!session) throwErr(404, "Chat session not found or already closed");

  // Save customer message
  session.messages.push({
    sender: MESSAGE_SENDER.CUSTOMER,
    content,
  });

  // Check if transfer needed (only in AI_MODE)
  if (session.mode === CHAT_MODE.AI_MODE && shouldTransferToStaff(content)) {
    const transferMsg = "Tôi sẽ kết nối bạn với nhân viên hỗ trợ ngay bây giờ.";
    session.messages.push({
      sender: MESSAGE_SENDER.AI,
      content: transferMsg,
    });
    session.mode = CHAT_MODE.SUPPORT_MODE;
    await session.save();
    return {
      session,
      aiReply: transferMsg,
      transferred: true,
    };
  }

  // If in AI_MODE, generate AI response
  if (session.mode === CHAT_MODE.AI_MODE) {
    const systemData = await buildSystemData(customerId);
    const aiReply = await generateAIResponse(
      AI_SYSTEM_PROMPT,
      systemData,
      session.messages,
    );

    session.messages.push({
      sender: MESSAGE_SENDER.AI,
      content: aiReply,
    });

    await session.save();
    return { session, aiReply, transferred: false };
  }

  // In SUPPORT_MODE, just save the message (staff will reply later)
  await session.save();
  return { session, aiReply: null, transferred: false };
}

/**
 * Staff sends a reply to a customer session (SUPPORT_MODE).
 */
export async function sendStaffMessage(sessionId, staffId, content) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    status: CHAT_STATUS.ACTIVE,
  });

  if (!session) throwErr(404, "Chat session not found or already closed");

  if (session.mode !== CHAT_MODE.SUPPORT_MODE) {
    throwErr(400, "Session is not in SUPPORT_MODE. Cannot send staff message.");
  }

  // Assign staff if not yet assigned
  if (!session.assignedStaffId) {
    session.assignedStaffId = staffId;
  }

  session.messages.push({
    sender: MESSAGE_SENDER.STAFF,
    content,
    staffId,
  });

  await session.save();
  return session;
}

/**
 * Transfer a session from AI_MODE to SUPPORT_MODE.
 */
export async function transferToStaff(sessionId) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    status: CHAT_STATUS.ACTIVE,
  });

  if (!session) throwErr(404, "Chat session not found or already closed");

  if (session.mode === CHAT_MODE.SUPPORT_MODE) {
    return session; // Already in support mode
  }

  session.mode = CHAT_MODE.SUPPORT_MODE;
  session.messages.push({
    sender: MESSAGE_SENDER.AI,
    content: "Tôi sẽ kết nối bạn với nhân viên hỗ trợ ngay bây giờ.",
  });

  await session.save();
  return session;
}

/**
 * Close a chat session.
 */
export async function closeSession(sessionId) {
  const session = await ChatSession.findById(sessionId);
  if (!session) throwErr(404, "Chat session not found");

  session.status = CHAT_STATUS.CLOSED;
  await session.save();
  return session;
}

/**
 * Get session by ID.
 */
export async function getSessionById(sessionId) {
  const session = await ChatSession.findById(sessionId)
    .populate("customerId", "fullName phone")
    .populate("assignedStaffId", "fullName")
    .lean();

  if (!session) throwErr(404, "Chat session not found");
  return session;
}

/**
 * Get all chat sessions for a customer.
 */
export async function getCustomerSessions(customerId, { page, limit, status }) {
  const {
    limit: safeLimit,
    offset,
    page: safePage,
  } = buildPagination({ page, limit });

  const filter = { customerId };
  if (status) filter.status = status;

  const [sessions, total] = await Promise.all([
    ChatSession.find(filter)
      .select("mode status assignedStaffId createdAt updatedAt")
      .populate("assignedStaffId", "fullName")
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .lean(),
    ChatSession.countDocuments(filter),
  ]);

  return {
    data: sessions,
    pagination: getPaginationMetadata(
      sessions.length,
      total,
      safeLimit,
      offset,
    ),
  };
}

/**
 * Get all SUPPORT_MODE sessions waiting for staff (unassigned or assigned to specific staff).
 */
export async function getStaffSessions(staffId, { page, limit, status }) {
  const {
    limit: safeLimit,
    offset,
    page: safePage,
  } = buildPagination({ page, limit });

  const filter = {
    mode: CHAT_MODE.SUPPORT_MODE,
  };
  if (status) filter.status = status;

  // Staff sees: unassigned sessions + sessions assigned to them
  if (staffId) {
    filter.$or = [{ assignedStaffId: null }, { assignedStaffId: staffId }];
  }

  const [sessions, total] = await Promise.all([
    ChatSession.find(filter)
      .populate("customerId", "fullName phone")
      .populate("assignedStaffId", "fullName")
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(safeLimit)
      .lean(),
    ChatSession.countDocuments(filter),
  ]);

  return {
    data: sessions,
    pagination: getPaginationMetadata(
      sessions.length,
      total,
      safeLimit,
      offset,
    ),
  };
}

/**
 * Assign a staff member to a support session.
 */
export async function assignStaffToSession(sessionId, staffId) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    mode: CHAT_MODE.SUPPORT_MODE,
    status: CHAT_STATUS.ACTIVE,
  });

  if (!session) throwErr(404, "Active support session not found");

  if (
    session.assignedStaffId &&
    session.assignedStaffId.toString() !== staffId.toString()
  ) {
    throwErr(400, "Session is already assigned to another staff member");
  }

  session.assignedStaffId = staffId;
  await session.save();
  return session;
}
