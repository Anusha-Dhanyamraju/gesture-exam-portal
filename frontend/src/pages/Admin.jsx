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

  async function fetchResults() {
    setLoadingResults(true);
    setResultsError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/results`);
      setResults(res.data || []);
    } catch (err) {
      setResultsError("Error fetching results from server.");
    } finally {
      setLoadingResults(false);
    }
  }

  async function verifyQuestionsFile() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/questions`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setQuestionsStatus(`✅ ${res.data.length} questions loaded.`);
      } else {
        setQuestionsStatus("⚠️ No questions found in DB.");
      }
    } catch {
      setQuestionsStatus("❌ Error verifying questions.");
    }
  }

  useEffect(() => {
    fetchResults();
    verifyQuestionsFile();
  }, []);

  async function handleUploadQuestions(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    const fileInput = document.getElementById("questionsFile");
    if (!fileInput || !fileInput.files[0]) {
      setUploadError("Please select a JSON file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      setUploading(true);
      const res = await axios.post(`${API_BASE_URL}/api/upload-questions`, formData);
      if (res.data.success) {
        setUploadSuccess("✅ Questions uploaded successfully!");
        verifyQuestionsFile();
      } else {
        setUploadError("❌ Invalid JSON format.");
      }
    } catch {
      setUploadError("❌ Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Dashboard</h1>

        {/* Upload Section */}
        <section style={styles.section}>
          <h2>Questions Management</h2>
          <input type="file" id="questionsFile" accept=".json" style={styles.fileInput} />
          <button onClick={handleUploadQuestions} style={styles.button}>
            {uploading ? "Uploading..." : "Upload Questions"}
          </button>

          {questionsStatus && <p style={styles.info}>{questionsStatus}</p>}
          {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}
          {uploadError && <p style={styles.error}>{uploadError}</p>}
        </section>

        {/* Results Section */}
        <section style={styles.section}>
          <div style={styles.row}>
            <h2>Student Results</h2>
            <button style={styles.refresh} onClick={fetchResults}>Refresh</button>
          </div>

          {loadingResults && <p style={styles.info}>Loading results...</p>}
          {resultsError && <p style={styles.error}>{resultsError}</p>}
          {!loadingResults && !resultsError && results.length === 0 && (
            <p style={styles.info}>No submissions yet.</p>
          )}

          {results.length > 0 && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.rollNumber}</td>
                      <td>{r.name}</td>
                      <td>{r.score}</td>
                      <td>{new Date(r.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(135deg, #1d4ed8, #0f172a)",
    minHeight: "100vh",
    padding: 30,
    display: "flex",
    justifyContent: "center",
  },
  card: {
    background: "rgba(0,0,0,0.55)",
    padding: 25,
    width: "90%",
    maxWidth: 900,
    color: "white",
    borderRadius: 14,
    backdropFilter: "blur(6px)"
  },
  title: { fontSize: 28, marginBottom: 20 },
  section: { marginBottom: 28 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  fileInput: { margin: "10px 0" },
  button: {
    background: "#2563eb",
    border: 0,
    padding: "8px 18px",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    marginTop: 8,
  },
  refresh: {
    border: "1px solid #60a5fa",
    padding: "5px 12px",
    borderRadius: 6,
    color: "#bfdbfe",
    background: "transparent",
    cursor: "pointer",
  },
  info: { color: "#bfdbfe" },
  error: { color: "#fecaca" },
  success: { color: "#bbf7d0" },
  tableWrapper: { overflowX: "auto", marginTop: 10 },
  table: { width: "100%", borderCollapse: "collapse" }
};
