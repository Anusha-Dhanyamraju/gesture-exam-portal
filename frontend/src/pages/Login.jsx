import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student"); // default
  const [id, setId] = useState("");           // roll number OR admin username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    if (!id || !password) {
      setError("Please enter both fields");
      return;
    }

    try {
      let url = "";
      let payload = {};

      if (role === "admin") {
        // 🔹 ADMIN LOGIN → backend on Render
        url = `${API_BASE_URL}/api/admin-login`;
        payload = {
          username: id,
          password: password,
        };
      } else {
        // 🔹 STUDENT LOGIN → backend on Render
        url = `${API_BASE_URL}/api/student-login`;
        payload = {
          name: id,          // using same for now
          rollNumber: id,
          // password is collected in UI but backend doesn’t use it yet
        };
      }

      const response = await axios.post(url, payload);

      if (response.data.success) {
        if (role === "admin") {
          navigate("/admin");
        } else {
          localStorage.setItem("studentRole", "student");
          localStorage.setItem("studentRollNumber", id);
          localStorage.setItem("studentName", id);
          navigate("/exam");
        }
      } else {
        setError(
          response.data.message ||
            response.data.error ||
            "Login failed. Please check your details."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Try again.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <h1 style={styles.brand}>Gesture Exam Portal</h1>
        <p style={styles.subtitle}>
          Hands-free, secure, and accessible online examinations.
        </p>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome</h2>
          <p style={styles.smallText}>
            Choose your role and sign in to continue.
          </p>

          {/* Role Selector */}
          <div style={styles.roleBox}>
            <button
              type="button"
              onClick={() => {
                setRole("student");
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

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder={role === "admin" ? "Admin Username" : "Roll Number"}
              value={id}
              onChange={(e) => setId(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.button}>
              Login
            </button>
          </form>

          <p style={styles.footerNote}>
            Admin: <strong>admin / admin123</strong> (demo)
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #1d4ed8, #0f172a)",
    color: "#f9fafb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  leftPanel: {
    flex: 1.2,
    padding: "60px 40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  brand: {
    fontSize: "40px",
    fontWeight: "800",
    marginBottom: "14px",
  },
  subtitle: {
    fontSize: "16px",
    maxWidth: "420px",
    lineHeight: 1.5,
    color: "#e5e7eb",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "rgba(15,23,42,0.92)",
    padding: "32px 28px",
    borderRadius: "16px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
    width: "100%",
    maxWidth: "380px",
    border: "1px solid rgba(148,163,184,0.4)",
  },
  title: {
    marginBottom: "4px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#f9fafb",
  },
  smallText: {
    marginBottom: "20px",
    fontSize: "13px",
    color: "#9ca3af",
  },
  input: {
    width: "100%",
    padding: "10px 11px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #4b5563",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    fontSize: "14px",
    outline: "none",
  },
  roleBox: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  roleButton: {
    flex: 1,
    padding: "8px 0",
    borderRadius: "999px",
    border: "1px solid #4b5563",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: "13px",
    cursor: "pointer",
  },
  roleButtonActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#f9fafb",
    fontWeight: "600",
  },
  button: {
    width: "100%",
    background: "#2563eb",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "4px",
    fontWeight: "600",
  },
  error: {
    color: "#fca5a5",
    marginBottom: "6px",
    fontSize: "13px",
  },
  footerNote: {
    marginTop: "12px",
    fontSize: "11px",
    color: "#9ca3af",
    textAlign: "center",
  },
};
