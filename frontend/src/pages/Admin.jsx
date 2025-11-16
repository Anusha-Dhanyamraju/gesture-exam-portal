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

  // ---------- FETCH RESULTS ----------
  async function fetchResults() {
    setLoadingResults(true);
    setResultsError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/results`);
      setResults(res.data || []);
    } catch (err) {
      console.error("Error fetching results:", err);
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
        setQuestionsStatus(`✅ ${data.length} questions loaded from database.`);
      } else {
        setQuestionsStatus("⚠️ No questions found in database.");
      }
    } catch (err) {
      console.error("Error verifying questions:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Error verifying questions.";
      setQuestionsStatus("❌ " + msg);
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
      setUploadError("Please select a questions.json file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      setUploading(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/upload-questions`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data && res.data.success) {
        setUploadSuccess("✅ Questions uploaded and stored in MongoDB.");
        setUploadError("");
        verifyQuestionsFile();
      } else {
        setUploadError("❌ Upload failed. Please check JSON format.");
      }
    } catch (err) {
      console.error("Error uploading questions:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Upload failed.";
      setUploadError("❌ " + msg);
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
          Upload question banks, monitor submissions, and review scores in a
          single clean interface.
        </p>
        <div style={styles.badgeRow}>
          <span style={styles.badge}>Gesture-Based Exams</span>
          <span style={styles.badge}>MongoDB Powered</span>
          <span style={styles.badge}>Real-time Results</span>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          {/* Upload Questions */}
          <section style={styles.section}>
            <h2 style={styles.heading}>Questions Management</h2>
            <p style={styles.smallText}>
              Upload a <strong>questions.json</strong> file to update the exam
              bank for all students.
            </p>

            <div style={styles.uploadRow}>
              <input
                type="file"
                id="questionsFile"
                accept=".json"
                style={styles.fileInput}
              />
              <button
                style={styles.primaryButton}
                onClick={handleUploadQuestions}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Questions"}
              </button>
            </div>

            {questionsStatus && (
              <p style={styles.statusText}>{questionsStatus}</p>
            )}
            {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}
            {uploadError && <p style={styles.error}>{uploadError}</p>}
          </section>

          {/* Results */}
          <section style={{ ...styles.section, marginTop: 20 }}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.heading}>Student Exam Results</h2>
                <p style={styles.smallText}>
                  View submitted answers and auto-calculated scores.
                </p>
              </div>
              <button style={styles.secondaryButton} onClick={fetchResults}>
                Refresh
              </button>
            </div>

            {loadingResults && <p style={styles.statusText}>Loading results...</p>}
            {resultsError && <p style={styles.error}>{resultsError}</p>}

            {!loadingResults && !resultsError && results.length === 0 && (
              <p style={styles.statusText}>No submissions yet.</p>
            )}

            {!loadingResults && !resultsError && results.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Roll Number</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Score</th>
                      <th style={styles.th}>Submitted At</th>
                      <th style={styles.th}>Answers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx}>
                        <td style={styles.td}>{r.rollNumber}</td>
                        <td style={styles.td}>{r.name}</td>
                        <td style={styles.td}>{r.score}</td>
                        <td style={styles.td}>
                          {r.submittedAt
                            ? new Date(r.submittedAt).toLocaleString()
                            : "-"}
                        </td>
                        <td style={styles.tdAnswers}>
                          {r.answers
                            ? Object.entries(r.answers).map(([q, ans]) => (
                                <div key={q} style={styles.answerLine}>
                                  <strong>{q}</strong>: {ans}
                                </div>
                              ))
                            : "No answers"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
    padding: "24px 18px",
    boxSizing: "border-box",
  },
  leftPanel: {
    flex: 1.1,
    padding: "40px 26px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  brand: {
    fontSize: "34px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "14px",
    maxWidth: "420px",
    lineHeight: 1.6,
    color: "#e5e7eb",
    marginBottom: "18px",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  badge: {
    fontSize: "11px",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(148,163,184,0.6)",
  },
  rightPanel: {
    flex: 1.3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    background: "rgba(15,23,42,0.96)",
    borderRadius: "18px",
    padding: "22px 22px 24px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
    border: "1px solid rgba(148,163,184,0.45)",
    boxSizing: "border-box",
  },
  section: {
    borderTop: "1px solid rgba(31,41,55,0.9)",
    paddingTop: "14px",
    marginTop: "6px",
  },
  heading: {
    fontSize: "17px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  smallText: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "10px",
  },
  uploadRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  },
  fileInput: {
    flex: 1,
    fontSize: "12px",
  },
  primaryButton: {
    padding: "8px 14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  secondaryButton: {
    padding: "7px 14px",
    backgroundColor: "transparent",
    color: "#bfdbfe",
    border: "1px solid #60a5fa",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
  statusText: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#9ca3af",
  },
  error: {
    color: "#fecaca",
    marginTop: "6px",
    fontSize: "12px",
  },
  success: {
    color: "#bbf7d0",
    marginTop: "6px",
    fontSize: "12px",
  },
  tableWrapper: {
    marginTop: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(55,65,81,0.9)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
    backgroundColor: "#020617",
  },
  th: {
    padding: "8px 10px",
    borderBottom: "1px solid #374151",
    backgroundColor: "#0b1120",
    fontWeight: "600",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "7px 10px",
    borderBottom: "1px solid #111827",
    verticalAlign: "top",
  },
  tdAnswers: {
    padding: "7px 10px",
    borderBottom: "1px solid #111827",
    verticalAlign: "top",
    maxWidth: "260px",
  },
  answerLine: {
    marginBottom: "3px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
};
