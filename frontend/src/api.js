import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT Bearer token into Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const tempToken = localStorage.getItem("tempToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (tempToken) {
      config.headers.Authorization = `Bearer ${tempToken}`;
      config.headers["x-temp-token"] = tempToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
