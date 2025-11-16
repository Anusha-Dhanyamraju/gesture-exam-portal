import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
        url = "http://localhost:5000/api/admin-login";
        payload = {
          username: id,
          password: password,
        };
      } else {
        // student
        url = "http://localhost:5000/api/student-login";
        payload = {
          name: id,          // for now we use same as roll; can separate later
          rollNumber: id,
        };
      }

      const response = await axios.post(url, payload);

      if (response.data.success) {
        if (role === "admin") {
          navigate("/admin");
        } else {
          // Save student info for exam / results
          localStorage.setItem("studentRole", "student");
          localStorage.setItem("studentRollNumber", id);
          localStorage.setItem("studentName", id); // you can change later
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
      console.error(err);
      setError("Server error. Try again.");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        {/* Role Selector */}
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

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#f3f4f6",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
    width: "350px",
    textAlign: "center",
  },
  title: { marginBottom: "20px" },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  roleBox: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  button: {
    width: "100%",
    background: "#2563eb",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: { color: "red", marginBottom: "10px" },
};
