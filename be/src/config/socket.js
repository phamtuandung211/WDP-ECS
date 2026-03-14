import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import CustomerSupport from "../models/CustomerSupport.js";
import SaleStaff from "../models/SaleStaff.js";
import Doctor from "../models/Doctor.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  sendCustomerMessage,
  sendStaffMessage,
  transferToStaff,
  transferToAI,
  closeSession,
  assignStaffToSession,
  startOrResumeSession,
} from "../services/chat.service.js";
import { CHAT_MODE } from "../constants/Chat.enum.js";
import { replayNotificationsForSocket } from "../services/appointmentRealtime.service.js";

let io;

/**
 * Initialise Socket.IO on the given HTTP server.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // ── Auth middleware ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing auth token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      socket.user = decoded;

      // Attach profile id
      if (decoded.role === ROLE_NAME.CUSTOMER) {
        const customer = await Customer.findOne({
          accountId: decoded.accountId,
        });
        if (!customer) return next(new Error("Customer profile not found"));
        socket.profileId = customer._id.toString();
        socket.profileModel = "Customer";
      } else if (decoded.role === ROLE_NAME.SALE_STAFF) {
        const saleStaff = await SaleStaff.findOne({
          accountId: decoded.accountId,
        });
        if (!saleStaff) return next(new Error("Sale staff profile not found"));
        socket.profileId = saleStaff._id.toString();
        socket.profileModel = "SaleStaff";
      } else if (decoded.role === ROLE_NAME.DOCTOR) {
        const doctor = await Doctor.findOne({
          accountId: decoded.accountId,
        });
        if (!doctor) return next(new Error("Doctor profile not found"));
        socket.profileId = doctor._id.toString();
        socket.profileModel = "Doctor";
      } else if (decoded.role === ROLE_NAME.CUSTOMER_SUPPORT) {
        const staff = await CustomerSupport.findOne({
          accountId: decoded.accountId,
        });
        if (!staff) return next(new Error("Staff profile not found"));
        socket.profileId = staff._id.toString();
        socket.profileModel = "CustomerSupport";
      } else {
        return next(new Error("Role not allowed for realtime"));
      }

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection handler ──────────────────────────────────────────
  io.on("connection", (socket) => {
    const { role } = socket.user;
    const profileId = socket.profileId;

    // Join personal room so we can push events to this user
    socket.join(`user:${profileId}`);

    // Staff joins a dedicated staff room
    if (role === ROLE_NAME.CUSTOMER_SUPPORT) {
      socket.join("staff:all");
    }

    if (role === ROLE_NAME.SALE_STAFF) {
      socket.join("sale_staff:all");
    }

    console.log(`Socket connected: ${role} (${profileId})`);

    replayNotificationsForSocket(socket).catch((err) => {
      console.warn(
        "[Socket] replayNotificationsForSocket failed:",
        err.message,
      );
    });

    socket.on("sync_appointment_notifications", async (callback) => {
      try {
        await replayNotificationsForSocket(socket);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    // ── Join a chat session room ────────────────────────────────
    socket.on("join_session", (sessionId) => {
      socket.join(`session:${sessionId}`);
    });

    socket.on("leave_session", (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    // ── Customer starts / resumes session ───────────────────────
    socket.on("start_session", async (callback) => {
      try {
        if (role !== ROLE_NAME.CUSTOMER) {
          return callback?.({ error: "Only customers can start sessions" });
        }
        const session = await startOrResumeSession(profileId);
        socket.join(`session:${session._id}`);
        callback?.({ data: session });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Customer sends a message ────────────────────────────────
    socket.on("customer_message", async ({ sessionId, content }, callback) => {
      try {
        if (role !== ROLE_NAME.CUSTOMER) {
          return callback?.({
            error: "Only customers can send customer messages",
          });
        }
        if (!content?.trim()) {
          return callback?.({ error: "Message content is required" });
        }

        const result = await sendCustomerMessage(
          sessionId,
          profileId,
          content.trim(),
        );

        const lastCustomerMsg =
          result.session.messages[
            result.session.messages.length - (result.aiReply ? 2 : 1)
          ];

        // Broadcast customer message to session room (staff sees it)
        socket.to(`session:${sessionId}`).emit("new_message", {
          sessionId,
          message: lastCustomerMsg,
        });

        // If AI replied, broadcast AI message too
        if (result.aiReply) {
          const aiMsg =
            result.session.messages[result.session.messages.length - 1];
          io.to(`session:${sessionId}`).emit("new_message", {
            sessionId,
            message: aiMsg,
          });
        }

        // If transferred to SUPPORT_MODE, notify staff room
        if (result.transferred) {
          io.to("staff:all").emit("session_needs_support", {
            sessionId,
            customerId: profileId,
          });
        }

        callback?.({
          data: {
            aiReply: result.aiReply,
            transferred: result.transferred,
            mode: result.session.mode,
          },
        });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Staff sends a message ───────────────────────────────────
    socket.on("staff_message", async ({ sessionId, content }, callback) => {
      try {
        if (role !== ROLE_NAME.CUSTOMER_SUPPORT) {
          return callback?.({ error: "Only staff can send staff messages" });
        }
        if (!content?.trim()) {
          return callback?.({ error: "Message content is required" });
        }

        const session = await sendStaffMessage(
          sessionId,
          profileId,
          content.trim(),
        );
        const lastMsg = session.messages[session.messages.length - 1];

        // Broadcast to session room (customer sees it)
        socket.to(`session:${sessionId}`).emit("new_message", {
          sessionId,
          message: lastMsg,
        });

        callback?.({ data: { mode: session.mode } });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Transfer session to staff ───────────────────────────────
    socket.on("transfer_to_staff", async ({ sessionId }, callback) => {
      try {
        const session = await transferToStaff(sessionId);
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

        callback?.({ data: { mode: session.mode } });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Transfer session back to AI ─────────────────────────────
    socket.on("transfer_to_ai", async ({ sessionId }, callback) => {
      try {
        const session = await transferToAI(sessionId);
        const lastMsg = session.messages[session.messages.length - 1];

        io.to(`session:${sessionId}`).emit("new_message", {
          sessionId,
          message: lastMsg,
        });

        io.to(`session:${sessionId}`).emit("mode_changed", {
          sessionId,
          mode: CHAT_MODE.AI_MODE,
        });

        callback?.({ data: { mode: session.mode } });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Staff assigns themselves ────────────────────────────────
    socket.on("assign_staff", async ({ sessionId }, callback) => {
      try {
        if (role !== ROLE_NAME.CUSTOMER_SUPPORT) {
          return callback?.({ error: "Only staff can assign" });
        }

        const session = await assignStaffToSession(sessionId, profileId);
        socket.join(`session:${sessionId}`);

        io.to(`session:${sessionId}`).emit("staff_assigned", {
          sessionId,
          staffId: profileId,
        });

        callback?.({ data: session });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Close session ───────────────────────────────────────────
    socket.on("close_session", async ({ sessionId }, callback) => {
      try {
        const session = await closeSession(sessionId);

        io.to(`session:${sessionId}`).emit("session_closed", { sessionId });

        callback?.({ data: session });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Typing indicator ────────────────────────────────────────
    socket.on("typing", ({ sessionId }) => {
      socket.to(`session:${sessionId}`).emit("user_typing", {
        sessionId,
        userId: profileId,
        role,
      });
    });

    socket.on("stop_typing", ({ sessionId }) => {
      socket.to(`session:${sessionId}`).emit("user_stop_typing", {
        sessionId,
        userId: profileId,
        role,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${role} (${profileId})`);
    });
  });

  return io;
}

/**
 * Get the current Socket.IO instance.
 */
export function getIO() {
  if (!io) throw new Error("Socket.IO not initialised");
  return io;
}
