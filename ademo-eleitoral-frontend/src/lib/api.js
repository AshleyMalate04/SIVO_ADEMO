import axios from "axios";
import { clearAuthData, getAuthToken } from "./storage";

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl && import.meta.env.PROD) {
  // Keep production from silently calling the developer machine.
  console.error("VITE_API_URL não está configurado no ambiente de produção.");
}

export const api = axios.create({
  baseURL: apiBaseUrl || "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // The API blocks every route until the initial password is replaced;
    // send the user to that step instead of leaving pages silently empty.
    if (
      error.response?.status === 403
      && error.response?.data?.errors?.code === "PASSWORD_CHANGE_REQUIRED"
      && window.location.pathname !== "/nova-senha"
    ) {
      window.location.href = "/nova-senha?primeiro_acesso=1";
    }

    return Promise.reject(error);
  },
);
