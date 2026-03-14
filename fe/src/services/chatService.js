import apiClient from "./apiClient";

export const chatService = {
  // Customer: start or resume session
  startSession: () => apiClient.post("/chat/session"),

  // Customer: send message
  sendMessage: (sessionId, content) =>
    apiClient.post(`/chat/session/${sessionId}/message`, { content }),

  // Customer: transfer to staff
  transferToStaff: (sessionId) =>
    apiClient.post(`/chat/session/${sessionId}/transfer`),

  // Customer: transfer back to AI
  transferToAI: (sessionId) =>
    apiClient.post(`/chat/session/${sessionId}/transfer-to-ai`),

  // Customer: get my sessions
  getMySessions: (params = {}) => apiClient.get("/chat/sessions", { params }),

  // Staff: get support sessions
  getStaffSessions: (params = {}) =>
    apiClient.get("/chat/sessions/staff", { params }),

  // Staff: send reply
  sendStaffMessage: (sessionId, content) =>
    apiClient.post(`/chat/session/${sessionId}/staff-message`, { content }),

  // Staff: assign self
  assignSession: (sessionId) =>
    apiClient.post(`/chat/session/${sessionId}/assign`),

  // Shared: get session details
  getSession: (sessionId) => apiClient.get(`/chat/session/${sessionId}`),

  // Shared: close session
  closeSession: (sessionId) =>
    apiClient.post(`/chat/session/${sessionId}/close`),
};
