import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const SAMPLE_QUESTION_JSON = `[
  {
    "question": "What does CPU stand for?",
    "options": {
      "a": "Central Processing Unit",
      "b": "Computer Personal Unit",
      "c": "Central Performance Utility",
      "d": "Control Processing Unit"
    },
    "answer": "a"
  }
]`;

const REQUIRED_OPTION_KEYS = ["a", "b", "c", "d"];

const createEmptyFileMeta = () => ({
  file: null,
  name: "",
  size: 0,
  totalQuestions: 0,
  preview: [],
  validationErrors: [],
});

export default function Admin() {
  const fileInputRef = useRef(null);

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState("");

  const [questionsStatus, setQuestionsStatus] = useState("");
  const [questionsMeta, setQuestionsMeta] = useState({
    count: 0,
    lastChecked: null,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [fileMeta, setFileMeta] = useState(createEmptyFileMeta);

  const resetFileMeta = () => {
    setFileMeta(createEmptyFileMeta());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) {
        setQuestionsStatus(`✅ ${data.length} questions available in MongoDB.`);
        setQuestionsMeta({
          count: data.length,
          lastChecked: new Date().toISOString(),
        });
      } else {
        setQuestionsStatus("⚠️ No questions found in database.");
        setQuestionsMeta({
          count: 0,
          lastChecked: new Date().toISOString(),
        });
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

  // ---------- FILE HANDLING ----------
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    setUploadError("");
    setUploadSuccess("");

    if (!file) {
      resetFileMeta();
      return;
    }

    const nextMeta = {
      file,
      name: file.name,
      size: file.size,
      totalQuestions: 0,
      preview: [],
      validationErrors: [],
    };

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of question objects.");
      }
      if (!parsed.length) {
        throw new Error("The array is empty.");
      }

      const preview = [];
      const errors = [];

      parsed.forEach((entry, idx) => {
        const issueList = [];
        const qText = entry.question || entry.q;
        if (!qText || typeof qText !== "string") {
          issueList.push("missing 'question' text");
        }

        if (!entry.options || typeof entry.options !== "object") {
          issueList.push("missing 'options' object");
        } else {
          REQUIRED_OPTION_KEYS.forEach((key) => {
            if (
              entry.options[key] == null ||
              entry.options[key].toString().trim() === ""
            ) {
              issueList.push(`option '${key}' is empty`);
            }
          });
        }

        const answer = entry.answer?.toString().toLowerCase();
        if (!answer || !REQUIRED_OPTION_KEYS.includes(answer)) {
          issueList.push("answer must be one of a/b/c/d");
        }

        if (issueList.length) {
          errors.push(`Q${idx + 1}: ${issueList.join("; ")}`);
        }

        if (preview.length < 3) {
          preview.push({
            question: qText || "(untitled)",
            answer: entry.answer || "-",
            options: entry.options || {},
          });
        }
      });

      nextMeta.totalQuestions = parsed.length;
      nextMeta.preview = preview;
      nextMeta.validationErrors = errors.slice(0, 5);
      setFileMeta(nextMeta);
    } catch (err) {
      nextMeta.validationErrors = [
        `Failed to parse JSON: ${err?.message || err.toString()}`,
      ];
      setFileMeta(nextMeta);
    }
  }

  // ---------- UPLOAD QUESTIONS ----------
  async function handleUploadQuestions(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    if (!fileMeta.file) {
      setUploadError("Please select a questions JSON file first.");
      return;
    }

    if (fileMeta.validationErrors.length) {
      setUploadError(
        "Resolve the validation issues before uploading to the server."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", fileMeta.file, fileMeta.name || "questions.json");

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
        setUploadSuccess(
          `✅ Uploaded ${fileMeta.totalQuestions} questions successfully.`
        );
        resetFileMeta();
        verifyQuestionsFile();
      } else {
        setUploadError(
          `❌ ${res.data?.error || "Upload failed. Server rejected the file."}`
        );
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

  const stats = useMemo(() => {
    if (!results.length) {
      return {
        avgScore: "-",
        bestScore: "-",
        lastSubmission: "-",
      };
    }

    const total = results.reduce(
      (acc, r) => acc + (Number(r.score) || 0),
      0
    );
    const best = Math.max(...results.map((r) => Number(r.score) || 0));
    const latest = [...results]
      .filter((r) => r.submittedAt)
      .sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      )[0];

    return {
      avgScore: (total / results.length).toFixed(1),
      bestScore: best,
      lastSubmission: latest
        ? new Date(latest.submittedAt).toLocaleString()
        : "-",
    };
  }, [results]);

  const humanFileSize = (size) => {
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ---------- UI ----------
  return (
    <div style={styles.page}>
      <header style={styles.hero}>
        <div>
          <p style={styles.heroEyebrow}>Gesture Exam • Admin Console</p>
          <h1 style={styles.heroTitle}>Manage questions & track submissions</h1>
          <p style={styles.heroSubtitle}>
            Validate JSON banks before uploading, keep MongoDB in sync, and
            monitor student performance in real time.
          </p>
        </div>
        <div style={styles.heroActions}>
          <button style={styles.linkButton} onClick={verifyQuestionsFile}>
            Re-check Questions
          </button>
          <button style={styles.linkButton} onClick={fetchResults}>
            Refresh Results
          </button>
        </div>
      </header>

      <section style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Question Bank</p>
          <h3 style={styles.statValue}>{questionsMeta.count}</h3>
          <p style={styles.statHint}>
            {questionsStatus || "Status pending…"}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Submissions</p>
          <h3 style={styles.statValue}>{results.length}</h3>
          <p style={styles.statHint}>Last: {stats.lastSubmission}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Average Score</p>
          <h3 style={styles.statValue}>{stats.avgScore}</h3>
          <p style={styles.statHint}>Best score: {stats.bestScore}</p>
        </div>
      </section>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Upload questions.json</h2>
              <p style={styles.panelSubtitle}>
                We validate the schema locally before hitting the server, so you
                see issues instantly.
              </p>
            </div>
          </div>

          <label style={styles.fileDrop}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={styles.hiddenInput}
              onChange={handleFileChange}
            />
            <span style={styles.fileDropIcon}>📄</span>
            <div>
              <p style={styles.fileDropTitle}>
                {fileMeta.name || "Drag & drop or click to choose JSON"}
              </p>
              {fileMeta.name && (
                <p style={styles.fileDropSubtitle}>
                  {humanFileSize(fileMeta.size)} • {fileMeta.totalQuestions}{" "}
                  detected questions
                </p>
              )}
            </div>
          </label>

          <button
            style={{
              ...styles.primaryButton,
              width: "100%",
              marginTop: "12px",
              opacity: uploading ? 0.7 : 1,
            }}
            onClick={handleUploadQuestions}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload to MongoDB"}
          </button>

          {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}
          {uploadError && <p style={styles.error}>{uploadError}</p>}

          {fileMeta.preview.length > 0 && (
            <div style={styles.previewBox}>
              <div style={styles.previewHeader}>
                <h3 style={styles.previewTitle}>
                  Preview ({fileMeta.totalQuestions} questions)
                </h3>
                <button style={styles.linkButton} onClick={resetFileMeta}>
                  Clear
                </button>
              </div>
              {fileMeta.preview.map((item, idx) => (
                <div key={idx} style={styles.previewItem}>
                  <p style={styles.previewQuestion}>
                    Q{idx + 1}. {item.question}
                  </p>
                  <p style={styles.previewAnswer}>Answer: {item.answer}</p>
                </div>
              ))}
            </div>
          )}

          {fileMeta.validationErrors.length > 0 && (
            <div style={styles.errorBox}>
              <p style={styles.errorTitle}>Validation issues</p>
              <ul style={styles.errorList}>
                {fileMeta.validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
              <p style={styles.errorHint}>
                Ensure each object contains `question`, `options.a-d`, and an
                `answer` that matches one of the options.
              </p>
            </div>
          )}

          <div style={styles.sampleBox}>
            <div style={styles.sampleHeader}>
              <p style={styles.sampleTitle}>Expected structure</p>
              <span style={styles.sampleBadge}>JSON</span>
            </div>
            <pre style={styles.sampleCode}>{SAMPLE_QUESTION_JSON}</pre>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Student submissions</h2>
              <p style={styles.panelSubtitle}>
                Auto-scored data pulled directly from MongoDB.
              </p>
            </div>
            <button style={styles.secondaryButton} onClick={fetchResults}>
              Refresh
            </button>
          </div>

          {loadingResults && (
            <p style={styles.statusText}>Loading results…</p>
          )}
          {resultsError && <p style={styles.error}>{resultsError}</p>}
          {!loadingResults && !resultsError && results.length === 0 && (
            <p style={styles.statusText}>No submissions yet.</p>
          )}

          {!loadingResults && !resultsError && results.length > 0 && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Roll #</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Submitted</th>
                    <th style={styles.th}>Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{r.rollNumber || "-"}</td>
                      <td style={styles.td}>{r.name || "Unknown"}</td>
                      <td style={styles.td}>{r.score ?? "-"}</td>
                      <td style={styles.td}>
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td style={styles.tdAnswers}>
                        {r.answers ? (
                          Object.entries(r.answers).map(([q, ans]) => (
                            <div key={q} style={styles.answerLine}>
                              <strong>{q}</strong>: {ans}
                            </div>
                          ))
                        ) : (
                          <span>—</span>
                        )}
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
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1e40af, #020617 55%)",
    color: "#f8fafc",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "32px",
    boxSizing: "border-box",
  },
  hero: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },
  heroEyebrow: {
    fontSize: "12px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#93c5fd",
    marginBottom: "6px",
  },
  heroTitle: {
    fontSize: "32px",
    fontWeight: 800,
    margin: 0,
  },
  heroSubtitle: {
    fontSize: "14px",
    color: "#bfdbfe",
    maxWidth: "520px",
    marginTop: "8px",
  },
  heroActions: {
    display: "flex",
    gap: "10px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  statCard: {
    padding: "16px",
    borderRadius: "16px",
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.35)",
  },
  statLabel: {
    fontSize: "12px",
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  },
  statValue: {
    fontSize: "28px",
    margin: 0,
    fontWeight: 700,
  },
  statHint: {
    fontSize: "12px",
    color: "#cbd5f5",
    marginTop: "4px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
  },
  panel: {
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid rgba(148,163,184,0.35)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
  },
  panelTitle: {
    fontSize: "20px",
    margin: 0,
  },
  panelSubtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  fileDrop: {
    border: "1px dashed rgba(148,163,184,0.6)",
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    backgroundColor: "rgba(2,6,23,0.6)",
    cursor: "pointer",
  },
  hiddenInput: {
    display: "none",
  },
  fileDropIcon: {
    fontSize: "28px",
  },
  fileDropTitle: {
    margin: 0,
    fontWeight: 600,
  },
  fileDropSubtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "12px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: 600,
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid rgba(37,99,235,0.6)",
    borderRadius: "999px",
    padding: "6px 14px",
    background: "transparent",
    color: "#bfdbfe",
    cursor: "pointer",
    fontSize: "12px",
  },
  linkButton: {
    border: "1px solid rgba(148,163,184,0.5)",
    borderRadius: "999px",
    padding: "6px 14px",
    background: "transparent",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: "12px",
  },
  success: {
    color: "#bbf7d0",
    marginTop: "10px",
    fontSize: "13px",
  },
  error: {
    color: "#fecaca",
    marginTop: "8px",
    fontSize: "13px",
  },
  statusText: {
    color: "#cbd5f5",
    fontSize: "13px",
    marginTop: "8px",
  },
  previewBox: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "rgba(2,6,23,0.6)",
    border: "1px solid rgba(148,163,184,0.35)",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  previewTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
  },
  previewItem: {
    borderTop: "1px solid rgba(148,163,184,0.2)",
    paddingTop: "6px",
    marginTop: "6px",
  },
  previewQuestion: {
    margin: 0,
    fontSize: "13px",
  },
  previewAnswer: {
    margin: 0,
    fontSize: "12px",
    color: "#a5b4fc",
  },
  errorBox: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "rgba(127,29,29,0.2)",
    border: "1px solid rgba(248,113,113,0.5)",
  },
  errorTitle: {
    margin: 0,
    fontWeight: 600,
    marginBottom: "6px",
  },
  errorList: {
    margin: "0 0 6px 18px",
    padding: 0,
    fontSize: "12px",
    lineHeight: 1.4,
  },
  errorHint: {
    margin: 0,
    fontSize: "11px",
    color: "#fecaca",
  },
  sampleBox: {
    marginTop: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.3)",
    overflow: "hidden",
  },
  sampleHeader: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: "rgba(15,23,42,0.8)",
    padding: "8px 12px",
  },
  sampleTitle: {
    margin: 0,
    fontSize: "13px",
  },
  sampleBadge: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.5)",
  },
  sampleCode: {
    margin: 0,
    padding: "12px",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    backgroundColor: "#020617",
    color: "#dbeafe",
  },
  tableWrapper: {
    marginTop: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.2)",
    overflow: "auto",
    maxHeight: "420px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  th: {
    textAlign: "left",
    padding: "10px",
    backgroundColor: "#0f172a",
    borderBottom: "1px solid rgba(148,163,184,0.2)",
    position: "sticky",
    top: 0,
  },
  td: {
    padding: "9px 10px",
    borderBottom: "1px solid rgba(148,163,184,0.1)",
    verticalAlign: "top",
  },
  tdAnswers: {
    padding: "9px 10px",
    borderBottom: "1px solid rgba(148,163,184,0.1)",
    minWidth: "180px",
  },
  answerLine: {
    marginBottom: "3px",
  },
};
