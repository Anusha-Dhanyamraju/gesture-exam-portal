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
      setResultsError("Error fetching results from server.");
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
        setQuestionsStatus(`✅ ${data.length} questions loaded from database`);
      } else {
        setQuestionsStatus("⚠️ No questions found in database.");
      }
    } catch (err) {
      console.error("Error verifying questions:", err);
      setQuestionsStatus("❌ Error verifying questions.");
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
      setUploadError("❌ Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  }

  // ---------------- RENDER ----------------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard</h1>

        {/* Upload Questions */}
        <section style={styles.section}>
          <h2 style={styles.heading}>Upload Questions File (JSON)</h2>
          <input type="file" id="questionsFile" accept=".json" />
          <button style={styles.button} onClick={handleUploadQuestions} disabled={uploading}>
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
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Submitted At</th>
                    <th>Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.rollNumber}</td>
                      <td>{r.name}</td>
                      <td>{r.score}</td>
                      <td>
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td>
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

          <button style={{ ...styles.button, marginTop: 10 }} onClick={fetchResults}>
            Refresh Results
          </button>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
    padding: "30px 10px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 0 10px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
  },
  section: {
    marginBottom: "30px",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "8px",
  },
  status: {
    marginTop: "8px",
  },
  error: {
    color: "red",
    marginTop: "8px",
  },
  success: {
    color: "green",
    marginTop: "8px",
  },
  tableWrapper: {
    marginTop: "12px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    padding: "8px",
    border: "1px solid #ddd",
  },
};
