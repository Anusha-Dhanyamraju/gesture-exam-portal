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

  // ---------------- FETCH RESULTS ----------------
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

  // ---------------- VERIFY QUESTIONS ----------------
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

  // ---------------- UPLOAD QUESTIONS ----------------
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

  // ---------------- RENDER ----------------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>
          Manage questions and monitor student performance in real time.
        </p>

        {/* Upload Questions */}
        <section style={styles.section}>
          <h2 style={styles.heading}>Upload Questions File (JSON)</h2>
          <input type="file" id="questionsFile" accept=".json" />
          <br />
          <button
            style={styles.button}
            onClick={handleUploadQuestions}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Questions"}
          </button>

          {questionsStatus && <p style={styles.status}>{questionsStatus}</p>}
          {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}
          {uploadError && <p style={styles.error}>{uploadError}</p>}
        </section>

        {/* Results */}
        <section style={styles.section}>
          <h2 style={styles.heading}>Student Exam Results</h2>

          {loadingResults && <p>Loading results...</p>}
          {resultsError && <p style={styles.error}>{resultsError}</p>}

          {!loadingResults && !resultsError && results.length === 0 && (
            <p>No submissions yet.</p>
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
                      <td style={styles.td}>
                        {r.answers
                          ? Object.entries(r.answers).map(([q, ans]) => (
                              <div key={q}>
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

          <button
            style={{ ...styles.button, marginTop: 10 }}
            onClick={fetchResults}
          >
            Refresh Results
          </button>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#0f172a",
    minHeight: "100vh",
    padding: "30px 10px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "#020617",
    borderRadius: "18px",
    padding: "24px 26px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
    border: "1px solid rgba(148,163,184,0.4)",
    color: "#e5e7eb",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#9ca3af",
    marginBottom: "18px",
  },
  section: {
    marginBottom: "26px",
    padding: "14px 0",
    borderTop: "1px solid rgba(31,41,55,0.8)",
  },
  heading: {
    fontSize: "17px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#e5e7eb",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
    marginTop: "8px",
    fontSize: "13px",
    fontWeight: "600",
  },
  status: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#9ca3af",
  },
  error: {
    color: "#fca5a5",
    marginTop: "8px",
    fontSize: "13px",
  },
  success: {
    color: "#4ade80",
    marginTop: "8px",
    fontSize: "13px",
  },
  tableWrapper: {
    marginTop: "12px",
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid rgba(55,65,81,0.9)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    backgroundColor: "#020617",
  },
  th: {
    padding: "10px",
    borderBottom: "1px solid #374151",
    backgroundColor: "#111827",
    fontWeight: "600",
    textAlign: "left",
  },
  td: {
    padding: "9px 10px",
    borderBottom: "1px solid #1f2937",
    verticalAlign: "top",
  },
};
