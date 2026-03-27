import apiClient from "./apiClient";

/** Base URL BE (bỏ /api) để ghép URL ảnh. Cloudinary URL giữ nguyên. */
export const getUploadFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = (apiClient.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return base + path;
};

export const UploadService = {
  uploadImage: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post("/upload", form);
    return data?.data?.url ?? data?.url ?? null;
  },
};

export const authService = {
  register: (payload) => apiClient.post("/auth/register", payload),

  verifyOtp: ({ email, otpCode }) =>
    apiClient.post("/auth/verify-otp", { email, otpCode }),

  resendOtp: ({ email }) => apiClient.post("/auth/resend-otp", { email }),

  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),

  googleAuth: (idToken) => apiClient.post("/auth/google", { idToken }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  },

  getToken: () =>
    localStorage.getItem("token") || sessionStorage.getItem("token"),

  getCurrentUser: () => {
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!user || user === "undefined" || user === "null") {
      // cleanup invalid stored values
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      return null;
    }
  },

  setToken: (token, remember = true) => {
    if (token === undefined || token === null) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } else {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      if (remember) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }
    }
  },

  setUser: (user, remember = true) => {
    if (user === undefined || user === null) {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    } else {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      if (remember) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("user", JSON.stringify(user));
      }
    }
  },
};

export const appointmentService = {
  // Get my appointments (Customer)
  getAll: (params = {}) => apiClient.get("/appointments", { params }),

  // Get appointment by ID
  getById: (id) => apiClient.get(`/appointments/${id}`),

  // Create new appointment (BASIC or ADVANCED)
  create: (data) => apiClient.post("/appointments", data),

  // Approve basic appointment & assign doctor/slot (Sale Staff)
  approve: (id, data) => apiClient.post(`/appointments/${id}/approve`, data),

  // Cancel appointment (Customer)
  cancel: (id) => apiClient.post(`/appointments/${id}/cancel`),

  // Complete appointment (Doctor)
  complete: (id) => apiClient.post(`/appointments/${id}/complete`),

  // Get all appointments for staff (Sale Staff/Doctor)
  getAllForStaff: (params = {}) =>
    apiClient.get("/appointments/staff", { params }),

  // Get my approval history (Sale Staff)
  getMyApprovalHistory: (params = {}) =>
    apiClient.get("/appointments/my-approval-history", { params }),

  // Update appointment (for future use)
  update: (id, data) => apiClient.put(`/appointments/${id}`, data),
};

export const slotService = {
  // Get available slots for a specific date
  getAvailable: (params = {}) => apiClient.get("/slots", { params }),
};

export const serviceService = {
  getAll: () => apiClient.get("/services"),
  getList: (params = {}) => apiClient.get("/services", { params }),
  getById: (id) => apiClient.get(`/services/${id}`),
};

export const manageServiceService = {
  getList: (params = {}) => apiClient.get("/manage-services", { params }),
  getById: (id) => apiClient.get(`/manage-services/${id}`),
  create: (data) => apiClient.post("/manage-services", data),
  update: (id, data) => apiClient.put(`/manage-services/${id}`, data),
  delete: (id) => apiClient.delete(`/manage-services/${id}`),
};

export const manageBlogService = {
  getList: (params = {}) => apiClient.get("/manage-blogs", { params }),
  getById: (id) => apiClient.get(`/manage-blogs/${id}`),
  create: (data) => apiClient.post("/manage-blogs", data),
  update: (id, data) => apiClient.put(`/manage-blogs/${id}`, data),
  delete: (id) => apiClient.delete(`/manage-blogs/${id}`),
};

export const blogService = {
  getList: (params = {}) => apiClient.get("/blogs", { params }),
  getById: (id) => apiClient.get(`/blogs/${id}`),
};

export const userService = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (data) => apiClient.put("/users/profile", data),
};

export const profileService = {
  changePassword: (data) => apiClient.post("/user/change-password", data),
  getMyProfile: () => apiClient.get("/user/me"),
  updateMyProfile: (data) => apiClient.patch("/user/me", data),
};

export const adminAccountService = {
  getAccounts: (params = {}) =>
    apiClient.get("/user/admin/accounts", { params }),
  updateStatus: (accountId, status) =>
    apiClient.patch(`/user/admin/accounts/${accountId}/status`, { status }),
  createStaffAccount: (payload) =>
    apiClient.post("/auth/register-staff", payload),
};

export const medicalRecordService = {
  create: (data) => apiClient.post("/medical-records", data),
  getMy: (params = {}) => apiClient.get("/medical-records/my", { params }),
  getAll: (params = {}) => apiClient.get("/medical-records", { params }),
  getById: (id) => apiClient.get(`/medical-records/${id}`),
  getByAppointment: (appointmentId) =>
    apiClient.get(`/medical-records/appointment/${appointmentId}`),
  update: (id, data) => apiClient.put(`/medical-records/${id}`, data),
};

export const feedbackService = {
  create: (data) => apiClient.post("/feedbacks", data),
  getMy: (params = {}) => apiClient.get("/feedbacks/my", { params }),
  getAll: (params = {}) => apiClient.get("/feedbacks", { params }),
  getById: (id) => apiClient.get(`/feedbacks/${id}`),
  getByAppointment: (appointmentId) =>
    apiClient.get(`/feedbacks/appointment/${appointmentId}`),
  review: (id) => apiClient.patch(`/feedbacks/${id}/review`),
};

export const statisticsService = {
  getOverview: (params = {}) =>
    apiClient.get("/statistics/overview", { params }),
  getRevenue: (params = {}) => apiClient.get("/statistics/revenue", { params }),
  getAppointments: (params = {}) =>
    apiClient.get("/statistics/appointments", { params }),
  getDoctors: (params = {}) => apiClient.get("/statistics/doctors", { params }),
  getCustomers: (params = {}) =>
    apiClient.get("/statistics/customers", { params }),
  getFeedbacks: (params = {}) =>
    apiClient.get("/statistics/feedbacks", { params }),
  getAccounts: (params = {}) =>
    apiClient.get("/statistics/accounts", { params }),
};

export const paymentService = {
  // Create payment link for appointment
  createPaymentLink: (appointmentId) =>
    apiClient.post("/payments/payos/create", { appointmentId }),

  // Handle cancel from PayOS checkout
  cancelPayment: (orderCode) =>
    apiClient.post("/payments/payos/cancel", { orderCode }),
};

export const doctorService = {
  getAllDoctor: (params = {}) => apiClient.get("/doctors", { params }),
  getList: (params = {}) => apiClient.get("/doctors", { params }),
  getDoctorById: (id) => apiClient.get(`/doctors/${id}`),
  getRelatedDoctor: (id) => apiClient.get(`/doctors/${id}/related`),
};

export const specializationService = {
  getAllSpecializations: (params = {}) =>
    apiClient.get("/specializations", { params }),
  getById: (id) => apiClient.get(`/specializations/${id}`),
  createSpecialization: (data) =>
    apiClient.post("/specializations/create", data),
  updateSpecialization: (id, data) =>
    apiClient.put(`/specializations/update/${id}`, data),
  deleteSpecialization: (id) =>
    apiClient.delete(`/specializations/delete/${id}`),
};

export const degreeService = {
  getAllNames: () => apiClient.get("/degrees/names"),
  getMyDegrees: (params = {}) =>
    apiClient.get("/degrees/my-degrees", { params }),
  addDegree: (data) => apiClient.post("/degrees/add-my-degrees", data),
  getDegreeDetail: (id) => apiClient.get(`/degrees/my-degrees/${id}`),
  updateDegree: (id, data) => apiClient.put(`/degrees/my-degrees/${id}`, data),
  deleteDegree: (id) => apiClient.delete(`/degrees/my-degrees/${id}`),
};

export const doctorProfileService = {
  getMyProfile: () => apiClient.get("/doctors/profile/me"),
  updateMyProfile: (data) => apiClient.put("/doctors/profile/me", data),
};

export const certificateService = {
  getMyCertificates: (params = {}) =>
    apiClient.get("/certificates/my-certificates", { params }),
  addCertificate: (data) =>
    apiClient.post("/certificates/add-my-certificates", data),
  getCertificateDetail: (id) =>
    apiClient.get(`/certificates/my-certificates/${id}`),
  updateCertificate: (id, data) =>
    apiClient.put(`/certificates/my-certificates/${id}`, data),
  deleteCertificate: (id) =>
    apiClient.delete(`/certificates/my-certificates/${id}`),
};

export const manageCertificateService = {
  reviewCertificate: (id, data) =>
    apiClient.patch(`/certificates/${id}/review`, data),
  getAllCertificates: (params = {}) =>
    apiClient.get("/certificates", { params }),
};

export const manageDegreeService = {
  reviewDegree: (id, data) => apiClient.patch(`/degrees/${id}/review`, data),
  getAllDegrees: (params = {}) => apiClient.get("/degrees", { params }),
};
