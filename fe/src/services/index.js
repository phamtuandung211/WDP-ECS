import apiClient from "./apiClient";

export const authService = {
  register: (email, password, name, role = "customer") =>
    apiClient.post("/auth/register", { email, password, name, role }),

  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  setToken: (token) => {
    localStorage.setItem("token", token);
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
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
  getById: (id) => apiClient.get(`/services/${id}`),
};

export const manageServiceService = {
  getList: (params = {}) =>
    apiClient.get("/manage-services", { params }),
  getById: (id) => apiClient.get(`/manage-services/${id}`),
  create: (data) => apiClient.post("/manage-services", data),
  update: (id, data) => apiClient.put(`/manage-services/${id}`, data),
  delete: (id) => apiClient.delete(`/manage-services/${id}`),
};

export const manageBlogService = {
  getList: (params = {}) =>
    apiClient.get("/manage-blogs", { params }),
  getById: (id) => apiClient.get(`/manage-blogs/${id}`),
  create: (data) => apiClient.post("/manage-blogs", data),
  update: (id, data) => apiClient.put(`/manage-blogs/${id}`, data),
  delete: (id) => apiClient.delete(`/manage-blogs/${id}`),
};

export const userService = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (data) => apiClient.put("/users/profile", data),
};
