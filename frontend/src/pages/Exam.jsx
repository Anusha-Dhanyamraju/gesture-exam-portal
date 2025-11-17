import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Exam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const answerRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [gestureStatus, setGestureStatus] = useState(
    "Gesture keyboard initializing..."
  );

  const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  // ---------- Keystroke Timing ----------
  const [keystrokeLog, setKeystrokeLog] = useState([]);
  const lastKeyTimeRef = useRef(null);

  function logKeypress(source, keyLabel) {
    const now = performance.now();
    let gap = null;
    if (lastKeyTimeRef.current != null) {
      gap = (now - lastKeyTimeRef.current) / 1000;
    }
    lastKeyTimeRef.current = now;

    setKeystrokeLog((prev) => [
      ...prev,
      {
        question: currentIndex + 1,
        source,
        key: keyLabel,
        time: now,
        gap,
      },
    ]);
  }

  // ---------- Load Questions ----------
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions`);
        const data = Array.isArray(res.data) ? res.data : [];
        if (!data.length) setQuestionsError("No questions found.");
        setQuestions(data);
      } catch (err) {
        setQuestionsError("Error loading questions.");
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, []);

  function handleAnswerChange(e) {
    const value = e.target.value;
    setAnswers((prev) => ({
      ...prev,
      [`Q${currentIndex + 1}`]: value,
    }));
  }

  function handleTextareaKeyDown(e) {
    const key = e.key;
    if (key.length === 1 || key === "Backspace" || key === " ") {
      const label = key === " " ? "SPACE" : key;
      logKeypress("physical", label);
    }
  }

  function goToQuestion(newIndex) {
    if (newIndex < 0 || newIndex >= questions.length) return;
    setCurrentIndex(newIndex);
    setSubmitMessage("");
  }

  // ---------- Submit Exam ----------
  async function handleSubmit() {
    if (!questions.length) return;
    if (!window.confirm("Submit exam now?")) return;

    setSubmitting(true);
    const name = localStorage.getItem("studentName") || "Student";
    const rollNumber = localStorage.getItem("studentRollNumber") || "Unknown";

    let score = 0;
    questions.forEach((q, i) => {
      const ans = (answers[`Q${i + 1}`] || "").trim().toLowerCase();
      if (q.answer && ans === q.answer.trim().toLowerCase()) score += 1;
    });

    try {
      await axios.post(`${API_BASE_URL}/api/submit-exam`, {
        name,
        rollNumber,
        answers,
        score,
        keystrokeLog,
      });
      setSubmitMessage(`✅ Submitted! Score: ${score}/${questions.length}`);
    } catch (err) {
      setSubmitMessage("❌ Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Gesture & MediaPipe Setup ----------
  useEffect(() => {
    let hands = null;
    let camera = null;
    let running = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js");

        if (typeof window.Hands !== "function") {
          setGestureStatus("Gesture keyboard not supported.");
          return;
        }

        hands = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        function typeChar(char) {
          const box = answerRef.current;
          if (!box) return;
          box.value += char === "SPACE" ? " " : char;
          logKeypress("gesture", char);
          setAnswers((p) => ({
            ...p,
            [`Q${currentIndex + 1}`]: box.value,
          }));
        }

        function backspace() {
          const box = answerRef.current;
          if (!box) return;
          box.value = box.value.slice(0, -1);
          setAnswers((p) => ({
            ...p,
            [`Q${currentIndex + 1}`]: box.value,
          }));
        }

        const hoverMap = new Map();
        hands.onResults((results) => {
          if (!running) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const keys = Array.from(document.querySelectorAll(".gesture-key"));
          const rects = keys.map((el) => ({ el, rect: el.getBoundingClientRect() }));

          if (results.multiHandLandmarks?.length > 0) {
            const lm = results.multiHandLandmarks[0];
            const indexTip = lm[8];
            const vRect = video.getBoundingClientRect();
            const pageX = vRect.left + indexTip.x * vRect.width;
            const pageY = vRect.top + indexTip.y * vRect.height;

            for (const { el, rect } of rects) {
              if (pageX >= rect.left && pageX <= rect.right && pageY >= rect.top && pageY <= rect.bottom) {
                el.classList.add("gesture-key-active");
                if (!hoverMap.has(el)) hoverMap.set(el, Date.now());
                if (Date.now() - hoverMap.get(el) > 600) {
                  const key = el.dataset.key;
                  if (key === "BACK") backspace();
                  else typeChar(key);
                  hoverMap.delete(el);
                }
              } else {
                el.classList.remove("gesture-key-active");
                hoverMap.delete(el);
              }
            }
          }
        });

        camera = new window.Camera(video, {
          onFrame: async () => {
            await hands.send({ image: video });
          },
        });
        camera.start();
        setGestureStatus("Gesture keyboard active ✔ | Snapshots ON");
      } catch (err) {
        setGestureStatus("Gesture setup failed.");
      }
    }

    setup();
    return () => {
      running = false;
      if (video?.srcObject)
        video.srcObject.getTracks().forEach((t) => t.stop());
    };
  }, [currentIndex]);

  // ---------- Snapshot Every 30s ----------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const snapCanvas = document.createElement("canvas");
    const snapCtx = snapCanvas.getContext("2d");

    async function takeSnapshot() {
      try {
        if (!video || video.readyState < 2) return;
        snapCanvas.width = video.videoWidth || 640;
        snapCanvas.height = video.videoHeight || 360;
        snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
        const dataUrl = snapCanvas.toDataURL("image/jpeg", 0.6);

        await axios.post(`${API_BASE_URL}/api/upload-snapshot`, {
          name: localStorage.getItem("studentName") || "Student",
          rollNumber: localStorage.getItem("studentRollNumber") || "Unknown",
          imageData: dataUrl,
        });
      } catch (err) {
        console.warn("Snapshot upload failed");
      }
    }

    const interval = setInterval(takeSnapshot, 30000);
    return () => clearInterval(interval);
  }, []);

  // ---------- Graph Data ----------
  const gapData = keystrokeLog.filter((d) => d.gap != null);
  const graphWidth = 280;
  const graphHeight = 100;

  let graphPoints = "";
  let maxGap = 0;
  if (gapData.length > 0) {
    maxGap = gapData.reduce((m, d) => Math.max(m, d.gap), 0);
    const usableWidth = graphWidth - 20;
    const usableHeight = graphHeight - 20;
    graphPoints = gapData
      .map((d, i) => {
        const x = (i / Math.max(gapData.length - 1, 1)) * usableWidth + 10;
        const y = graphHeight - (d.gap / maxGap) * usableHeight - 10;
        return `${x},${y}`;
      })
      .join(" ");
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[`Q${currentIndex + 1}`] || "";

  return (
    <div style={styles.page}>
      <div style={styles.examContainer}>
        {/* Webcam + Canvas */}
        <div style={styles.webcamWrapper}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          <canvas ref={canvasRef} style={styles.canvas} />
          <div style={styles.statusBadge}>{gestureStatus}</div>
        </div>

        {/* Question Panel */}
        <div style={styles.questionPanel}>
          <h2 style={styles.panelTitle}>Exam Questions</h2>

          {loadingQuestions && <p>Loading questions...</p>}
          {questionsError && <p style={{ color: "#fca5a5" }}>{questionsError}</p>}

          {!loadingQuestions && !questionsError && currentQuestion && (
            <>
              <p style={styles.questionText}>
                <strong>Q{currentIndex + 1}.</strong> {currentQuestion.question}
              </p>

              {/* MCQ Options */}
              {currentQuestion.options && (
                <div style={styles.optionsBox}>
                  {["a", "b", "c", "d"].map((opt) => (
                    <div key={opt} style={styles.optionRow}>
                      <span style={styles.optionLabel}>{opt.toUpperCase()}.</span>
                      <span>{currentQuestion.options[opt]}</span>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={answerRef}
                value={currentAnswer}
                onKeyDown={handleTextareaKeyDown}
                onChange={handleAnswerChange}
                placeholder="Answer here…"
                style={styles.textarea}
              />

              <div style={styles.navRow}>
                <button
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  style={styles.navButton}
                >
                  Previous
                </button>

                <span style={styles.questionCounter}>
                  {currentIndex + 1} / {questions.length || 1}
                </span>

                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  style={styles.navButton}
                >
                  Next
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={styles.submitButton}
              >
                {submitting ? "Submitting…" : "Submit Exam"}
              </button>

              {submitMessage && (
                <p
                  style={{
                    marginTop: 6,
                    color: submitMessage.startsWith("✅") ? "#bbf7d0" : "#fca5a5",
                  }}
                >
                  {submitMessage}
                </p>
              )}

              {/* Typing Graph */}
              {gapData.length > 1 && (
                <div style={styles.graphBox}>
                  <div style={styles.graphTitle}>
                    Time gap between letters (seconds)
                  </div>
                  <svg width={graphWidth} height={graphHeight} style={styles.graphSvg}>
                    <line
                      x1="10"
                      y1={graphHeight - 10}
                      x2={graphWidth - 5}
                      y2={graphHeight - 10}
                      stroke="#4b5563"
                    />
                    <line x1="10" y1="10" x2="10" y2={graphHeight - 10} stroke="#4b5563" />

                    {graphPoints && (
                      <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        points={graphPoints}
                      />
                    )}
                  </svg>
                  <div style={styles.graphFooter}>
                    <span style={styles.graphAxisLabel}>Letters →</span>
                    <span style={styles.graphAxisLabel}>
                      Max gap: {maxGap.toFixed(2)}s
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Virtual Keyboard */}
        <div style={styles.keyboardWrapper}>
          {keyboardRows.map((row, i) => (
            <div key={i} style={styles.keyboardRow}>
              {row.split("").map((ch) => (
                <div key={ch} className="gesture-key" data-key={ch} style={styles.key}>
                  {ch}
                </div>
              ))}
            </div>
          ))}
          <div style={styles.keyboardRow}>
            <div className="gesture-key" data-key="BACK" style={{ ...styles.key, minWidth: 80 }}>
              ⌫
            </div>
            <div className="gesture-key" data-key="SPACE" style={{ ...styles.key, flex: 1 }}>
              SPACE
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .gesture-key-active {
          background-color: #2563eb !important;
          color: #f9fafb !important;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

// ---------- UI Styles ----------
const styles = {
  page: {
    height: "100vh",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    fontFamily: "system-ui, sans-serif",
    padding: 10,
  },
  examContainer: {
    position: "relative",
    height: "100%",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.5)",
    background: "radial-gradient(circle at top left, #1d4ed8 0, #020617 45%, #000 100%)",
  },
  webcamWrapper: { position: "absolute", inset: 0 },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  canvas: { position: "absolute", inset: 0 },
  statusBadge: {
    position: "absolute",
    left: 16,
    top: 16,
    padding: "6px 10px",
    fontSize: 11,
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(148,163,184,0.8)",
  },
  questionPanel: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 340,
    maxWidth: "90vw",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 16,
    padding: "14px 16px",
    border: "1px solid rgba(148,163,184,0.7)",
  },
  panelTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  questionText: { fontSize: 14, marginBottom: 6 },
  optionsBox: {
    marginBottom: 8,
    padding: "6px 8px",
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid #4b5563",
  },
  optionRow: { display: "flex", gap: 6, fontSize: 13 },
  optionLabel: { fontWeight: "600", minWidth: 18 },
  textarea: {
    width: "100%",
    minHeight: 80,
    borderRadius: 8,
    border: "1px solid #4b5563",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    padding: 8,
  },
  navRow: { display: "flex", justifyContent: "space-between", marginTop: 8 },
  navButton: {
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid #4b5563",
    backgroundColor: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  submitButton: {
    marginTop: 10,
    width: "100%",
    padding: 8,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#22c55e",
    color: "#022c22",
    fontWeight: 600,
    cursor: "pointer",
  },
  questionCounter: { fontSize: 12, color: "#9ca3af" },
  keyboardWrapper: {
    position: "absolute",
    left: "50%",
    bottom: 12,
    transform: "translateX(-50%)",
    width: "92%",
    maxWidth: 900,
    backgroundColor: "rgba(15,23,42,0.92)",
    borderRadius: 18,
    padding: "10px 14px",
    border: "1px solid rgba(148,163,184,0.7)",
  },
  keyboardRow: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 },
  key: {
    minWidth: 44,
    padding: "10px 0",
    borderRadius: "999px",
    backgroundColor: "#1f2937",
    border: "1px solid #4b5563",
    textAlign: "center",
    fontSize: 15,
    fontWeight: 600,
    userSelect: "none",
  },
  graphBox: {
    marginTop: 10,
    padding: "8px 10px",
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.95)",
    border: "1px solid #4b5563",
  },
  graphTitle: { fontSize: 12, marginBottom: 4 },
  graphSvg: { backgroundColor: "#020617", borderRadius: 6 },
  graphFooter: {
    marginTop: 4,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
  },
  graphAxisLabel: { fontSize: 11 },
};
