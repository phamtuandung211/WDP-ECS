import apiClient from "./apiClient";

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

export const doctorService = {
  getAllDoctor: () => apiClient.get("/doctors"),
  getDoctorById: (id) => apiClient.get(`/doctors/${id}`)
}