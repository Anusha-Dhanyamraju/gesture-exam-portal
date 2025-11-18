import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!id || (role === "admin" && !password)) {
      setError("Please fill in the required fields.");
      return;
    }

    try {
      setLoading(true);
      let url = "";
      let payload = {};

      if (role === "admin") {
        url = `${API_BASE_URL}/api/admin-login`;
        payload = { username: id, password };
      } else {
        url = `${API_BASE_URL}/api/student-login`;
        payload = { name: id, rollNumber: id };
      }

      const res = await axios.post(url, payload);

      if (res.data.success) {
        if (role === "admin") {
          navigate("/admin");
        } else {
          localStorage.setItem("studentName", id);
          localStorage.setItem("studentRollNumber", id);
          navigate("/exam");
        }
      } else {
        setError(res.data.error || "Login failed. Please check your details.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.glowOrbTop} />
      <div style={styles.glowOrbBottom} />

      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <p style={styles.eyebrow}>Gesture Exam Portal</p>
            <h1 style={styles.heroTitle}>Sign in</h1>
          </div>

            <div style={styles.roleToggle}>
              <button
                type="button"
                onClick={() => {
                  setRole("student");
                  setPassword("");
                  setError("");
                }}
                style={{
                  ...styles.roleButton,
                  ...(role === "student" ? styles.roleButtonActive : {}),
                }}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("admin");
                  setError("");
                }}
                style={{
                  ...styles.roleButton,
                  ...(role === "admin" ? styles.roleButtonActive : {}),
                }}
              >
                Admin
              </button>
            </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              <span style={styles.labelText}>
                {role === "admin" ? "Admin username" : "Name / Roll number"}
              </span>
              <input
                style={styles.input}
                type="text"
                placeholder={
                  role === "admin" ? "eg. admin" : "eg. CS23-001 / John Doe"
                }
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </label>

            {role === "admin" && (
              <label style={styles.label}>
                <span style={styles.labelText}>Password</span>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}

            {error && <p style={styles.error}>{error}</p>}

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.8 : 1,
              }}
              disabled={loading}
            >
              {loading
                ? role === "admin"
                  ? "Signing in…"
                  : "Joining exam…"
                : role === "admin"
                ? "Sign in as admin"
                : "Start exam"}
            </button>

            <p style={styles.helperText}>
              Use <strong>admin / admin123</strong> to access the admin
              dashboard. Learn more on the <a href="/about">About</a> page.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    background:
      "radial-gradient(circle at top left, #1d4ed8 0, #020617 45%, #000 100%)",
    color: "#e5e7eb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  glowOrbTop: {
    position: "absolute",
    top: "-120px",
    right: "-80px",
    width: "260px",
    height: "260px",
    background:
      "radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%)",
    filter: "blur(6px)",
    pointerEvents: "none",
  },
  glowOrbBottom: {
    position: "absolute",
    bottom: "-140px",
    left: "-80px",
    width: "260px",
    height: "260px",
    background:
      "radial-gradient(circle, rgba(34,197,94,0.32), transparent 70%)",
    filter: "blur(8px)",
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    borderRadius: "22px",
    padding: "22px 20px 20px",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
    border: "1px solid rgba(148,163,184,0.7)",
    boxShadow: "0 24px 55px rgba(0,0,0,0.75)",
    boxSizing: "border-box",
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#93c5fd",
    marginBottom: "6px",
  },
  heroTitle: {
    fontSize: "28px",
    fontWeight: 800,
    margin: 0,
  },
  heroAccent: {
    color: "#22c55e",
  },
  heroSubtitle: {
    fontSize: "13px",
    color: "#cbd5f5",
    marginTop: "8px",
    maxWidth: "420px",
    lineHeight: 1.6,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "14px",
  },
  chip: {
    fontSize: "11px",
    padding: "5px 9px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.6)",
  },
  card: {
    width: "100%",
    borderRadius: "16px",
    padding: "10px 2px 2px",
    boxSizing: "border-box",
  },
  cardHeader: {
    marginBottom: "10px",
  },
  cardTitle: {
    fontSize: "18px",
    margin: 0,
    fontWeight: 700,
  },
  cardSubtitle: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  roleToggle: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    padding: "4px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(55,65,81,0.9)",
    marginBottom: "10px",
  },
  roleButton: {
    borderRadius: "999px",
    border: "none",
    padding: "6px 0",
    fontSize: "12px",
    fontWeight: 500,
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    transition: "all 0.12s ease",
  },
  roleButtonActive: {
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.85), rgba(37,99,235,0.95))",
    color: "#f9fafb",
    boxShadow: "0 0 0 1px rgba(191,219,254,0.85)",
  },
  form: {
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "left",
  },
  labelText: {
    fontSize: "12px",
    color: "#cbd5f5",
  },
  input: {
    width: "100%",
    padding: "9px 10px",
    borderRadius: "10px",
    border: "1px solid #4b5563",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  button: {
    marginTop: "6px",
    width: "100%",
    padding: "9px 10px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(135deg, #22c55e, #16a34a, #22c55e 80%, #22d3ee)",
    color: "#022c22",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
  error: {
    fontSize: "12px",
    color: "#fecaca",
    marginTop: "2px",
  },
  helperText: {
    marginTop: "8px",
    fontSize: "11px",
    color: "#9ca3af",
    textAlign: "center",
  },
};
