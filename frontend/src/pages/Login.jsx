import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
      {/* Animated background orbs */}
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />
      <div style={styles.glowOrb3} />

      {/* Main container */}
      <div style={styles.container}>
        {/* Logo/Brand section */}
        <div style={styles.brandSection}>
          <div style={styles.logoCircle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <h1 style={styles.brandTitle}>Gesture Exam</h1>
          <p style={styles.brandSubtitle}>
            Touchless exam platform powered by AI gesture recognition
          </p>
        </div>

        {/* Login card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {role === "admin" ? "Admin Portal" : "Student Portal"}
            </h2>
            <p style={styles.cardSubtitle}>
              {role === "admin"
                ? "Manage questions and view results"
                : "Take your exam using hand gestures"}
            </p>
          </div>

          {/* Role toggle */}
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
              <span style={styles.roleIcon}>👨‍🎓</span>
              <span>Student</span>
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
              <span style={styles.roleIcon}>👨‍💼</span>
              <span>Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                {role === "admin" ? "Username" : "Name / Roll Number"}
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  {role === "admin" ? "👤" : "🆔"}
                </span>
                <input
                  style={styles.input}
                  type="text"
                  placeholder={
                    role === "admin" ? "Enter username" : "Enter your name or roll number"
                  }
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {role === "admin" && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    style={styles.input}
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonLoading : {}),
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  <span>
                    {role === "admin" ? "Signing in..." : "Joining exam..."}
                  </span>
                </>
              ) : (
                <>
                  <span>{role === "admin" ? "Sign In" : "Start Exam"}</span>
                  <span style={styles.buttonArrow}>→</span>
                </>
              )}
            </button>

            <div style={styles.footer}>
              <p style={styles.helperText}>
                {role === "admin" && (
                  <>
                    Demo: <strong>admin</strong> / <strong>admin123</strong>
                  </>
                )}
              </p>
              <Link to="/about" style={styles.aboutLink}>
                Learn more about this platform →
              </Link>
            </div>
          </form>
        </div>

        {/* Features preview */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🎯</span>
            <span style={styles.featureText}>Gesture Control</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🔒</span>
            <span style={styles.featureText}>Secure</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>⚡</span>
            <span style={styles.featureText}>Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    color: "#f1f5f9",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  glowOrb1: {
    position: "absolute",
    top: "-100px",
    right: "-100px",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
    animation: "float 8s ease-in-out infinite",
  },
  glowOrb2: {
    position: "absolute",
    bottom: "-150px",
    left: "-150px",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)",
    filter: "blur(50px)",
    pointerEvents: "none",
    animation: "float 10s ease-in-out infinite reverse",
  },
  glowOrb3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    animation: "pulse 12s ease-in-out infinite",
  },
  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  brandSection: {
    textAlign: "center",
    marginBottom: "8px",
  },
  logoCircle: {
    width: "80px",
    height: "80px",
    margin: "0 auto 16px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(34,197,94,0.2))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#60a5fa",
    border: "1px solid rgba(148,163,184,0.2)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  brandTitle: {
    fontSize: "36px",
    fontWeight: 800,
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #60a5fa, #34d399)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  brandSubtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.5,
  },
  card: {
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "32px",
    border: "1px solid rgba(148,163,184,0.2)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    boxSizing: "border-box",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 6px 0",
    color: "#f1f5f9",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },
  roleToggle: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "24px",
    padding: "4px",
    borderRadius: "16px",
    background: "rgba(30,41,59,0.6)",
    border: "1px solid rgba(148,163,184,0.1)",
  },
  roleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  roleButtonActive: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
  },
  roleIcon: {
    fontSize: "18px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#cbd5e1",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "18px",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 44px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(30,41,59,0.5)",
    color: "#f1f5f9",
    fontSize: "14px",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    outline: "none",
  },
  inputFocus: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  errorIcon: {
    fontSize: "18px",
  },
  errorText: {
    fontSize: "13px",
    color: "#fca5a5",
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
  },
  submitButtonLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  buttonArrow: {
    fontSize: "18px",
    transition: "transform 0.2s ease",
  },
  footer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },
  helperText: {
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center",
    margin: 0,
  },
  aboutLink: {
    fontSize: "12px",
    color: "#60a5fa",
    textDecoration: "none",
    textAlign: "center",
    transition: "color 0.2s ease",
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  feature: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  featureIcon: {
    fontSize: "24px",
  },
  featureText: {
    fontSize: "12px",
    color: "#94a3b8",
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, -20px) scale(1.1); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  input:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
  }
  a:hover {
    color: #93c5fd !important;
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(34,197,94,0.4) !important;
  }
`;
document.head.appendChild(styleSheet);
