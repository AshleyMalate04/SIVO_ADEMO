import { api } from "../lib/api";

export async function login(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function logoutAll() {
  const response = await api.post("/auth/logout-all");
  return response.data;
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function forgotPassword(payload) {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
}

export async function verifyCode(payload) {
  const response = await api.post("/auth/verify-code", payload);
  return response.data;
}

export async function resetPassword(payload) {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
}
