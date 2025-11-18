// src/config.js
const envUrl =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== "undefined" ? window.__API_BASE_URL__ : undefined);

export const API_BASE_URL =
  (envUrl && envUrl.replace(/\/$/, "")) || "http://localhost:5000";
