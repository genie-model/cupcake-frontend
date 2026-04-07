import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ctoaster_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      localStorage.removeItem("ctoaster_token");
      localStorage.removeItem("ctoaster_user");
      window.location.href = "/"; // back to login
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE };
