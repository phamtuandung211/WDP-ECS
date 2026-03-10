import Customer from "../models/Customer.js";
import CustomerSupport from "../models/CustomerSupport.js";
import { getIO } from "../config/socket.js";
import { CHAT_MODE } from "../constants/Chat.enum.js";
import {
  startOrResumeSession,
  sendCustomerMessage,
  sendStaffMessage,
  transferToStaff,
  transferToAI,
  closeSession,
  getSessionById,
  getCustomerSessions,
  getStaffSessions,
  assignStaffToSession,
} from "../services/chat.service.js";

/**
 * POST /api/chat/session
 * Customer starts or resumes a chat session.
 */
export const startSession = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    const customer = await Customer.findOne({ accountId });
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const session = await startOrResumeSession(customer._id);
    res.status(200).json({ data: session });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * POST /api/chat/session/:sessionId/message
 * Customer sends a message.
 */
export const customerSendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const accountId = req.user.accountId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const customer = await Customer.findOne({ accountId });
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const result = await sendCustomerMessage(
      sessionId,
      customer._id,
      content.trim(),
    );

    // Emit via Socket.IO for real-time
    try {
      const io = getIO();
      const msgs = result.session.messages;
      const customerMsg = msgs[msgs.length - (result.aiReply ? 2 : 1)];

      io.to(`session:${sessionId}`).emit("new_message", {
        sessionId,
        message: customerMsg,
      });

      if (result.aiReply) {
        const aiMsg = msgs[msgs.length - 1];
        io.to(`session:${sessionId}`).emit("new_message", {
          sessionId,
          message: aiMsg,
        });
      }

      if (result.transferred) {
        io.to("staff:all").emit("session_needs_support", {
          sessionId,
          customerId: customer._id.toString(),
        });
      }
    } catch (_) {
      // Socket not available — REST still works
    }

    res.status(200).json({
      data: {
        aiReply: result.aiReply,
        transferred: result.transferred,
        mode: result.session.mode,
        messageCount: result.session.messages.length,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * POST /api/chat/session/:sessionId/staff-message
 * Staff sends a reply in SUPPORT_MODE.
 */
export const staffSendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const accountId = req.user.accountId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const staff = await CustomerSupport.findOne({ accountId });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const session = await sendStaffMessage(
      sessionId,
      staff._id,
      content.trim(),
    );

    // Emit via Socket.IO for real-time
    try {
      const io = getIO();
      const lastMsg = session.messages[session.messages.length - 1];
      io.to(`session:${sessionId}`).emit("new_message", {
        sessionId,
        message: lastMsg,
      });
    } catch (_) {
      // Socket not available — REST still works
    }

    res.status(200).json({
      data: {
        mode: session.mode,
        messageCount: session.messages.length,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * POST /api/chat/session/:sessionId/transfer
 * Transfer session from AI to staff.
 */
export const transferSessionToStaff = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await transferToStaff(sessionId);

    try {
      const io = getIO();
      const lastMsg = session.messages[session.messages.length - 1];
      io.to(`session:${sessionId}`).emit("new_message", {
        sessionId,
        message: lastMsg,
      });
      io.to(`session:${sessionId}`).emit("mode_changed", {
        sessionId,
        mode: CHAT_MODE.SUPPORT_MODE,
      });
      io.to("staff:all").emit("session_needs_support", {
        sessionId,
        customerId: session.customerId.toString(),
      });
    } catch (_) {}

    res.status(200).json({ data: session });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * POST /api/chat/session/:sessionId/transfer-to-ai
 * Transfer session from staff back to AI.
 */
export const transferSessionToAI = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await transferToAI(sessionId);

    try {
      const io = getIO();
      const lastMsg = session.messages[session.messages.length - 1];
      io.to(`session:${sessionId}`).emit("new_message", {
        sessionId,
        message: lastMsg,
      });
      io.to(`session:${sessionId}`).emit("mode_changed", {
        sessionId,
        mode: CHAT_MODE.AI_MODE,
      });
    } catch (_) {}

    res.status(200).json({ data: session });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * POST /api/chat/session/:sessionId/close
 * Close a chat session.
 */
export const closeSessionController = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await closeSession(sessionId);

    try {
      const io = getIO();
      io.to(`session:${sessionId}`).emit("session_closed", { sessionId });
    } catch (_) {}

    res.status(200).json({ data: session });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * GET /api/chat/session/:sessionId
 * Get session details with messages.
 */
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionById(sessionId);

    res.status(200).json({ data: session });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * GET /api/chat/sessions
 * Customer gets their chat sessions.
 */
export const getMySessions = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    const customer = await Customer.findOne({ accountId });
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const { page, limit, status } = req.query;
    const result = await getCustomerSessions(customer._id, {
      page,
      limit,
      status,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * GET /api/chat/sessions/staff
 * Staff gets support sessions.
 */
export const getStaffSessionsList = async (req, res) => {
  try {
    const accountId = req.user.accountId;
    const staff = await CustomerSupport.findOne({ accountId });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const { page, limit, status } = req.query;
    const result = await getStaffSessions(staff._id, { page, limit, status });

    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * POST /api/chat/session/:sessionId/assign
 * Staff assigns themselves to a session.
 */
export const assignStaff = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const accountId = req.user.accountId;

    const staff = await CustomerSupport.findOne({ accountId });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const session = await assignStaffToSession(sessionId, staff._id);

    res.status(200).json({ data: session });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
