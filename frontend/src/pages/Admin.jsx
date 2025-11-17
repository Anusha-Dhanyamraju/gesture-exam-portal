import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Admin() {
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState("");

  const [questionsStatus, setQuestionsStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Snapshot states
  const [snapshots, setSnapshots] = useState([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [snapError, setSnapError] = useState("");

  // ---------- FETCH RESULTS ----------
  async function fetchResults() {
    setLoadingResults(true);
    setResultsError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/results`);
      setResults(res.data || []);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Error fetching results from server.";
      setResultsError(msg);
    } finally {
      setLoadingResults(false);
    }
  }

  // ---------- VERIFY QUESTIONS ----------
  async function verifyQuestionsFile() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/questions`);
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setQuestionsStatus(`✅ ${data.length} questions in database.`);
      } else {
        setQuestionsStatus("⚠️ No questions found.");
      }
    } catch (err) {
      setQuestionsStatus("❌ Unable to verify questions.");
    }
  }

  // ---------- FETCH SNAPSHOTS ----------
  async function fetchSnapshots() {
    setLoadingSnaps(true);
    setSnapError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/snapshots`);
      setSnapshots(res.data || []);
    } catch (err) {
      setSnapError("Error fetching snapshots");
    } finally {
      setLoadingSnaps(false);
    }
  }

  useEffect(() => {
    fetchResults();
    verifyQuestionsFile();
  }, []);

  // ---------- UPLOAD QUESTIONS ----------
  async function handleUploadQuestions(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    const fileInput = document.getElementById("questionsFile");
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      setUploadError("Please select questions.json first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      setUploading(true);
      const res = await axios.post(`${API_BASE_URL}/api/upload-questions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setUploadSuccess("✅ Questions uploaded successfully.");
        verifyQuestionsFile();
      } else {
        setUploadError("❌ Upload failed. Invalid JSON format.");
      }
    } catch (err) {
      setUploadError("❌ Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // ---------- UI ----------
  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <h1 style={styles.brand}>Admin Dashboard</h1>
        <p style={styles.subtitle}>
          Manage questions, track student performance, and review proctoring snapshots.
        </p>
        <div style={styles.badgeRow}>
          <span style={styles.badge}>Gesture-based Exams</span>
          <span style={styles.badge}>MongoDB Secure</span>
          <span style={styles.badge}>Auto Snapshots</span>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>

          {/* Upload Questions */}
          <section style={styles.section}>
            <h2 style={styles.heading}>Questions Management</h2>
            <p style={styles.smallText}>Upload <strong>questions.json</strong> to update exam database.</p>

            <div style={styles.uploadRow}>
              <input type="file" id="questionsFile" accept=".json" style={styles.fileInput} />
              <button style={styles.primaryButton} onClick={handleUploadQuestions} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            {questionsStatus && <p style={styles.statusText}>{questionsStatus}</p>}
            {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}
            {uploadError && <p style={styles.error}>{uploadError}</p>}
          </section>

          {/* Results */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.heading}>Student Results</h2>
                <p style={styles.smallText}>View answers & auto score.</p>
              </div>
              <button style={styles.secondaryButton} onClick={fetchResults}>Refresh</button>
            </div>

            {loadingResults && <p style={styles.statusText}>Loading results…</p>}
            {resultsError && <p style={styles.error}>{resultsError}</p>}
            {!loadingResults && !resultsError && results.length === 0 && (
              <p style={styles.statusText}>No submissions yet.</p>
            )}

            {!loadingResults && !resultsError && results.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Roll</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Score</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Answers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{r.rollNumber}</td>
                        <td style={styles.td}>{r.name}</td>
                        <td style={styles.td}>{r.score}</td>
                        <td style={styles.td}>
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}
                        </td>
                        <td style={styles.td}>
                          {r.answers && Object.entries(r.answers).map(([q, a]) => (
                            <div key={q}><strong>{q}:</strong> {a}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Snapshots */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.heading}>Student Snapshots</h2>
                <p style={styles.smallText}>
                  Auto-captured every 30s to prevent cheating.
                </p>
              </div>
              <button style={styles.secondaryButton} onClick={fetchSnapshots}>
                Load Snapshots
              </button>
            </div>

            {loadingSnaps && <p style={styles.statusText}>Loading snapshots…</p>}
            {snapError && <p style={styles.error}>{snapError}</p>}
            {!loadingSnaps && snapshots.length === 0 && (
              <p style={styles.statusText}>No snapshots yet.</p>
            )}

            {!loadingSnaps && snapshots.length > 0 && (
              <div style={styles.snapGrid}>
                {snapshots.map((s, i) => (
                  <div style={styles.snapCard} key={i}>
                    <img src={s.imageData} style={{ width: "100%", borderRadius: 8 }} />
                    <div style={styles.snapMeta}>
                      <strong>{s.rollNumber}</strong> - {s.name}<br />
                      <span style={{ fontSize: 10 }}>
                        {new Date(s.capturedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------ STYLES --------------- */
const styles = {
  page: {
    height: "100vh",
    display: "flex",
    background: "linear-gradient(135deg,#1d4ed8,#0f172a)",
    color: "#f1f5f9",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "system-ui, sans-serif",
  },
  leftPanel: { flex: 1, padding: 30, display: "flex", flexDirection: "column", justifyContent: "center" },
  brand: { fontSize: 36, fontWeight: 800 },
  subtitle: { fontSize: 14, opacity: 0.85, margin: "10px 0 18px" },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: {
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(148,163,184,0.4)",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: 11,
  },
  rightPanel: { flex: 1.4, display: "flex", justifyContent: "center", alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 800,
    background: "rgba(15,23,42,0.95)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(148,163,184,0.35)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
  },
  section: { paddingTop: 14, marginTop: 14, borderTop: "1px solid rgba(51,65,85,0.8)" },
  heading: { fontSize: 18, fontWeight: 600 },
  smallText: { fontSize: 12, opacity: 0.8, marginBottom: 10 },
  uploadRow: { display: "flex", gap: 10, alignItems: "center" },
  fileInput: { flex: 1, fontSize: 12 },
  primaryButton: {
    background: "#2563eb",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "none",
    fontSize: 13,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "7px 14px",
    borderRadius: "999px",
    border: "1px solid #60a5fa",
    background: "transparent",
    color: "#bfdbfe",
    cursor: "pointer",
    fontSize: 12,
  },
  statusText: { fontSize: 12, color: "#cbd5e1", marginTop: 6 },
  error: { color: "#fecaca", fontSize: 12, marginTop: 6 },
  success: { color: "#bbf7d0", fontSize: 12, marginTop: 6 },

  tableWrapper: {
    marginTop: 10,
    borderRadius: 10,
    overflowX: "auto",
    border: "1px solid rgba(51,65,85,0.7)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { padding: "8px 10px", background: "#0b1120", textAlign: "left" },
  td: { padding: "6px 10px", borderBottom: "1px solid #1e293b" },

  /* Snapshot Grid */
  snapGrid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))",
    gap: "10px",
  },
  snapCard: {
    background: "rgba(15,23,42,0.85)",
    padding: 6,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.4)",
  },
  snapMeta: { marginTop: 4, fontSize: 11, color: "#e2e8f0" },
};
