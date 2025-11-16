import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Admin() {
  const [questionsStatus, setQuestionsStatus] = useState("");
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  // Fetch results when page loads
  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    try {
      setLoadingResults(true);
      setError("");
      const res = await axios.get("http://localhost:5000/api/results");
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching results.");
    } finally {
      setLoadingResults(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setQuestionsStatus("Uploading...");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload-questions",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        setQuestionsStatus("✅ Questions uploaded successfully!");
      } else {
        setQuestionsStatus("❌ Upload failed");
        setError(res.data.error || "Upload failed.");
      }
    } catch (err) {
      console.error(err);
      setQuestionsStatus("❌ Upload failed");
      setError("Server error while uploading file.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard</h1>

        {/* Upload Questions Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Upload Questions File</h2>
          <p style={styles.helpText}>
            Upload a <b>questions.json</b> file. Format example:
          </p>
          <pre style={styles.codeBlock}>
{`[
  { "question": "2 + 2 = ?", "answer": "4" },
  { "question": "Capital of India?", "answer": "New Delhi" }
]`}
          </pre>
          <input
            type="file"
            accept=".json"
            onChange={handleUpload}
            style={styles.fileInput}
          />
          {questionsStatus && <p style={styles.status}>{questionsStatus}</p>}
        </section>

        {/* Results Section */}
        <section style={styles.section}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.sectionTitle}>Student Exam Results</h2>
            <button style={styles.refreshBtn} onClick={fetchResults}>
              Refresh
            </button>
          </div>

          {loadingResults && <p>Loading results...</p>}
          {error && <p style={styles.error}>{error}</p>}

          {results.length === 0 && !loadingResults ? (
            <p>No submissions yet.</p>
          ) : (
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
                                <strong>{q}:</strong> {ans}
                              </div>
                            ))
                          : "-"}
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
  );
}

const styles = {
  page: {
    background: "#f3f4f6",
    minHeight: "100vh",
    padding: "20px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "20px",
    textAlign: "center",
  },
  section: {
    marginTop: "20px",
    paddingTop: "10px",
    borderTop: "1px solid #e5e7eb",
  },
  sectionTitle: {
    marginBottom: "10px",
  },
  helpText: {
    fontSize: "14px",
    color: "#4b5563",
  },
  codeBlock: {
    background: "#f9fafb",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "13px",
    overflowX: "auto",
  },
  fileInput: {
    marginTop: "10px",
  },
  status: {
    marginTop: "8px",
    fontWeight: "bold",
  },
  tableWrapper: {
    marginTop: "10px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  error: {
    color: "red",
  },
  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshBtn: {
    padding: "6px 12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
