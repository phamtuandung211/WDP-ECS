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

export const userService = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (data) => apiClient.put("/users/profile", data),
};
