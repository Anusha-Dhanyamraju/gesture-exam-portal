// src/config.js
const envUrl =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== "undefined" ? window.__API_BASE_URL__ : undefined);

function deriveDefaultUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:5000";
  }

  const host = window.location.hostname;
  const isLocalhost =
    host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (isLocalhost) {
    return "http://localhost:5000";
  }

  // Fallback for deployed frontend (Vercel) hitting Render backend
  return "https://gesture-exam-portal.onrender.com";
}

export const API_BASE_URL =
  (envUrl && envUrl.replace(/\/$/, "")) || deriveDefaultUrl();
