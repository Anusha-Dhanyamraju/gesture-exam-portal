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

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!id || (role === "admin" && !password)) {
      setError("Please enter required fields");
      return;
    }

    try {
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
        setError(res.data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <div style={styles.roleBox}>
          <label>
            <input
              type="radio"
              value="student"
              checked={role === "student"}
              onChange={() => {
                setRole("student");
                setError("");
              }}
            />
            Student
          </label>
          <label>
            <input
              type="radio"
              value="admin"
              checked={role === "admin"}
              onChange={() => {
                setRole("admin");
                setError("");
              }}
            />
            Admin
          </label>
        </div>

        <input
          style={styles.input}
          type="text"
          placeholder={role === "admin" ? "Admin Username" : "Roll Number"}
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        {role === "admin" && (
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    background: "radial-gradient(circle at top, #1e3a8a, #020617 60%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "system-ui",
  },
  card: {
    width: 320,
    background: "rgba(15,23,42,0.85)",
    padding: 24,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    textAlign: "center",
    color: "white",
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 14 },
  roleBox: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border: "1px solid #475569",
    background: "#0f172a",
    color: "white",
    marginBottom: 10,
  },
  button: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    background: "#3b82f6",
    border: "none",
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { fontSize: 12, color: "#fca5a5", marginBottom: 8 },
};
