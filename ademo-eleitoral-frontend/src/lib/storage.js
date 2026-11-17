const TOKEN_KEY = "ademo_token";
const USER_KEY = "ademo_user";
const MENU_KEY = "ademo_menu";

export function saveAuthData({ token, user, menu = [] }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
  setEchoAuthToken(token);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser() {
  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    clearAuthData();
    return null;
  }
}

export function getAuthMenu() {
  const menu = localStorage.getItem(MENU_KEY);

  if (!menu) return [];

  try {
    return JSON.parse(menu);
  } catch {
    return [];
  }
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MENU_KEY);
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("ademo-ballot-selection-"))
    .forEach((key) => sessionStorage.removeItem(key));
  setEchoAuthToken(null);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export const storage = {
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
  remove: (key) => localStorage.removeItem(key),
};
import { setEchoAuthToken } from './echo'
