import { getStoredToken } from "../utils/storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
};
