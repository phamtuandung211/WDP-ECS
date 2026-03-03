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

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined" || user === "null") {
      // cleanup invalid stored values
      localStorage.removeItem("user");
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      localStorage.removeItem("user");
      return null;
    }
  },

  setToken: (token) => {
    if (token === undefined || token === null) {
      localStorage.removeItem("token");
    } else {
      localStorage.setItem("token", token);
    }
  },

  setUser: (user) => {
    if (user === undefined || user === null) {
      localStorage.removeItem("user");
    } else {
      localStorage.setItem("user", JSON.stringify(user));
    }
  },
};

export const appointmentService = {
  getAll: () => apiClient.get("/appointments"),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  create: (data) => apiClient.post("/appointments", data),
  update: (id, data) => apiClient.put(`/appointments/${id}`, data),
  delete: (id) => apiClient.delete(`/appointments/${id}`),
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
  getMyProfile: () => apiClient.get("/user/me"),
  updateMyProfile: (data) => apiClient.put("/user/me", data),
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
  getOverview: (params = {}) => apiClient.get("/statistics/overview", { params }),
  getRevenue: (params = {}) => apiClient.get("/statistics/revenue", { params }),
  getAppointments: (params = {}) => apiClient.get("/statistics/appointments", { params }),
  getDoctors: (params = {}) => apiClient.get("/statistics/doctors", { params }),
  getFeedbacks: (params = {}) => apiClient.get("/statistics/feedbacks", { params }),
  getAccounts: (params = {}) => apiClient.get("/statistics/accounts", { params }),
};

export const doctorService = {
  getAllDoctor: () => apiClient.get("/doctors"),
  getDoctorById: (id) => apiClient.get(`/doctors/${id}`),
};