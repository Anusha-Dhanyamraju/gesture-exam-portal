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
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error fetching results.";
      setResultsError(msg);
    } finally {
      setLoadingResults(false);
    }
  }

  async function verifyQuestionsFile() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/questions`);
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setQuestionsStatus(`✅ ${data.length} questions loaded from DB.`);
      } else {
        setQuestionsStatus("⚠️ No questions stored.");
      }
    } catch (err) {
      setQuestionsStatus("❌ Error verifying questions.");
    }
  }

  useEffect(() => { fetchResults(); verifyQuestionsFile(); }, []);

  async function handleUploadQuestions() {
    const fileInput = document.getElementById("questionsFile");
    if (!fileInput.files[0]) {
      setUploadError("Select JSON file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      setUploading(true);
      const res = await axios.post(`${API_BASE_URL}/api/upload-questions`, formData);

      if (res.data.success) {
        setUploadSuccess("✅ Questions updated.");
        setUploadError("");
        verifyQuestionsFile();
      } else setUploadError("❌ Invalid JSON format.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 24, background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <h1>Admin Dashboard</h1>
      <p>Upload Question Bank & View Student Results</p>

      <h2>Upload Questions JSON</h2>
      <input type="file" id="questionsFile" accept="application/json" />
      <button onClick={handleUploadQuestions} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Questions"}
      </button>
      <p>{questionsStatus}</p>
      <p style={{ color: "red" }}>{uploadError}</p>
      <p style={{ color: "#6ef38f" }}>{uploadSuccess}</p>

      <h2>Exam Results</h2>
      {loadingResults && <p>Loading...</p>}
      {resultsError && <p style={{ color: "red" }}>{resultsError}</p>}

      {!loadingResults && !resultsError && results.length > 0 && (
        <table border="1" cellPadding="6" style={{ background: "white", color: "black" }}>
          <thead>
            <tr>
              <th>Roll</th><th>Name</th><th>Score</th><th>Submitted</th>
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
      )}
    </div>
  );
}
