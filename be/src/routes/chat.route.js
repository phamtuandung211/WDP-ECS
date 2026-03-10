import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { ROLE_NAME } from "../constants/Role.enum.js";
import {
  startSession,
  customerSendMessage,
  staffSendMessage,
  transferSessionToStaff,
  transferSessionToAI,
  closeSessionController,
  getSession,
  getMySessions,
  getStaffSessionsList,
  assignStaff,
} from "../controllers/chat.controller.js";

const router = express.Router();

// ─── Customer routes ────────────────────────────────────────────────

// POST /api/chat/session – Start or resume a chat session
router.post(
  "/session",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  startSession,
);

// POST /api/chat/session/:sessionId/message – Customer sends a message
router.post(
  "/session/:sessionId/message",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  customerSendMessage,
);

// POST /api/chat/session/:sessionId/transfer – Customer requests transfer to staff
router.post(
  "/session/:sessionId/transfer",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  transferSessionToStaff,
);

// POST /api/chat/session/:sessionId/transfer-to-ai – Customer switches back to AI
router.post(
  "/session/:sessionId/transfer-to-ai",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  transferSessionToAI,
);

// GET /api/chat/sessions – Customer gets their sessions
router.get(
  "/sessions",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER),
  getMySessions,
);

// ─── Staff routes ───────────────────────────────────────────────────

// GET /api/chat/sessions/staff – Staff gets support sessions
router.get(
  "/sessions/staff",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER_SUPPORT),
  getStaffSessionsList,
);

// POST /api/chat/session/:sessionId/staff-message – Staff sends a reply
router.post(
  "/session/:sessionId/staff-message",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER_SUPPORT),
  staffSendMessage,
);

// POST /api/chat/session/:sessionId/assign – Staff assigns themselves
router.post(
  "/session/:sessionId/assign",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER_SUPPORT),
  assignStaff,
);

// ─── Shared routes ──────────────────────────────────────────────────

// GET /api/chat/session/:sessionId – Get session details (Customer or Staff)
router.get(
  "/session/:sessionId",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER, ROLE_NAME.CUSTOMER_SUPPORT),
  getSession,
);

// POST /api/chat/session/:sessionId/close – Close session (Customer or Staff)
router.post(
  "/session/:sessionId/close",
  authenticate,
  authorize(ROLE_NAME.CUSTOMER, ROLE_NAME.CUSTOMER_SUPPORT),
  closeSessionController,
);

export default router;
