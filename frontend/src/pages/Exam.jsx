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
  const [mediapipeAvailable, setMediapipeAvailable] = useState(true);

  const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  // ---------- NEW: Keystroke timing state ----------
  const [keystrokeLog, setKeystrokeLog] = useState([]);
  const lastKeyTimeRef = useRef(null);

  function logKeypress(source, keyLabel) {
    const now = performance.now(); // ms since page load
    let gap = null;

    if (lastKeyTimeRef.current != null) {
      gap = (now - lastKeyTimeRef.current) / 1000; // seconds
    }
    lastKeyTimeRef.current = now;

    setKeystrokeLog((prev) => [
      ...prev,
      {
        question: currentIndex + 1,
        source, // "gesture" or "physical"
        key: keyLabel,
        time: now,
        gap,
      },
    ]);
  }

  // ----------- LOAD QUESTIONS -----------
  useEffect(() => {
    async function loadQuestions() {
      setLoadingQuestions(true);
      setQuestionsError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions`);
        const data = Array.isArray(res.data) ? res.data : [];
        if (!data.length) {
          setQuestionsError("No questions found. Please contact admin.");
        }
        setQuestions(data);
      } catch (err) {
        console.error("Error loading questions:", err);
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to load questions.";
        setQuestionsError(msg);
      } finally {
        setLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, []);

  // ----------- ANSWER HANDLING -----------
  function handleAnswerChange(e) {
    const value = e.target.value;
    setAnswers((prev) => ({
      ...prev,
      [`Q${currentIndex + 1}`]: value,
    }));
  }

  // NEW: capture physical keyboard timings
  function handleTextareaKeyDown(e) {
    const key = e.key;

    // Only log real typing keys: letters, space & backspace
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

  // ----------- SUBMIT EXAM -----------
  async function handleSubmit() {
    if (!questions.length) return;
    if (!window.confirm("Are you sure you want to submit the exam?")) return;

    setSubmitting(true);
    setSubmitMessage("");

    try {
      const name = localStorage.getItem("studentName") || "Student";
      const rollNumber =
        localStorage.getItem("studentRollNumber") || "Unknown";

      let score = 0;
      questions.forEach((q, i) => {
        const ans = (answers[`Q${i + 1}`] || "").trim().toLowerCase();
        if (q.answer && ans === q.answer.trim().toLowerCase()) {
          score += 1;
        }
      });

      const payload = {
        name,
        rollNumber,
        answers,
        score,
        keystrokeLog, // optional: you can also store it in DB for analysis
      };

      const res = await axios.post(`${API_BASE_URL}/api/submit-exam`, payload);
      if (res.data && res.data.success) {
        setSubmitMessage(
          `✅ Exam submitted successfully! Score: ${score}/${questions.length}`
        );
      } else {
        setSubmitMessage("❌ Failed to submit exam. Try again.");
      }
    } catch (err) {
      console.error("Submit exam error:", err);
      setSubmitMessage("❌ Server error while submitting exam.");
    } finally {
      setSubmitting(false);
    }
  }

  // ----------- GESTURE + MEDIAPIPE SETUP -----------
  useEffect(() => {
    let hands = null;
    let camera = null;
    let running = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setGestureStatus("Gesture keyboard not ready (video/canvas missing).");
      return;
    }

    const ctx = canvas.getContext("2d");

    const loadScript = (src, timeoutMs = 10000) =>
      new Promise((resolve, reject) => {
        if (typeof document === "undefined") {
          reject(new Error("document not available"));
          return;
        }

        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const s = document.createElement("script");
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          s.onload = null;
          s.onerror = null;
          reject(new Error(`Timeout loading script: ${src}`));
        }, timeoutMs);

        s.src = src;
        s.async = true;
        s.onload = () => {
          if (timedOut) return;
          clearTimeout(timer);
          resolve();
        };
        s.onerror = () => {
          if (timedOut) return;
          clearTimeout(timer);
          reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(s);
      });

    async function setup() {
      try {
        // Start webcam
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
          });
          video.srcObject = stream;
          await video.play();
        } catch (err) {
          console.warn("Could not access webcam:", err);
          setGestureStatus(
            "Could not access webcam. Please allow camera permission."
          );
        }

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        // Load MediaPipe scripts
        try {
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js"
          );
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js"
          );
          await loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js"
          );
        } catch (err) {
          console.error("MediaPipe scripts failed:", err);
          setMediapipeAvailable(false);
          setGestureStatus(
            "Gesture keyboard disabled (MediaPipe failed to load)."
          );
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          return;
        }

        if (
          typeof window.Hands !== "function" ||
          typeof window.Camera !== "function" ||
          typeof window.drawConnectors !== "function" ||
          typeof window.drawLandmarks !== "function" ||
          typeof window.HAND_CONNECTIONS === "undefined"
        ) {
          console.error("MediaPipe globals missing on window:", {
            HandsType: typeof window.Hands,
            CameraType: typeof window.Camera,
            drawConnectorsType: typeof window.drawConnectors,
            drawLandmarksType: typeof window.drawLandmarks,
            handConnections: typeof window.HAND_CONNECTIONS,
          });
          setMediapipeAvailable(false);
          setGestureStatus("Gesture keyboard disabled (incompatible browser).");
          return;
        }

        hands = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        });

        const hoverMap = new Map();
        let fistStart = null;
        let spaceStart = null;

        function typeChar(char) {
          const box = answerRef.current;
          if (!box) return;
          if (char === "SPACE") {
            box.value += " ";
          } else {
            box.value += char;
          }

          // NEW: log gesture keypress
          logKeypress("gesture", char);

          setAnswers((prev) => ({
            ...prev,
            [`Q${currentIndex + 1}`]: box.value,
          }));
        }

        function backspace() {
          const box = answerRef.current;
          if (!box) return;
          box.value = box.value.slice(0, -1);

          setAnswers((prev) => ({
            ...prev,
            [`Q${currentIndex + 1}`]: box.value,
          }));
        }

        hands.onResults((results) => {
          if (!running) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const keyElems = Array.from(
            document.querySelectorAll(".gesture-key")
          );
          const rects = keyElems.map((el) => ({
            el,
            rect: el.getBoundingClientRect(),
          }));

          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
          ) {
            const landmarks = results.multiHandLandmarks[0];

            try {
              window.drawConnectors(
                ctx,
                landmarks,
                window.HAND_CONNECTIONS,
                { color: "#22c55e", lineWidth: 2 }
              );
              window.drawLandmarks(ctx, landmarks, {
                color: "#ef4444",
                lineWidth: 1,
              });
            } catch (e) {
              console.warn("Drawing error:", e);
            }

            const indexTip = landmarks[8];
            const wrist = landmarks[0];

            const vRect = video.getBoundingClientRect();
            const pageX = vRect.left + indexTip.x * vRect.width;
            const pageY = vRect.top + indexTip.y * vRect.height;

            const canvasX = indexTip.x * canvas.width;
            const canvasY = indexTip.y * canvas.height;

            ctx.fillStyle = "rgba(59,130,246,0.9)";
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 8, 0, Math.PI * 2);
            ctx.fill();

            // Hover detection
            for (const { el, rect } of rects) {
              if (
                pageX >= rect.left &&
                pageX <= rect.right &&
                pageY >= rect.top &&
                pageY <= rect.bottom
              ) {
                el.classList.add("gesture-key-active");
                if (!hoverMap.has(el)) hoverMap.set(el, Date.now());
                const elapsed = Date.now() - hoverMap.get(el);

                if (elapsed >= 600) {
                  const keyText = el.dataset.key;
                  if (keyText === "BACK") backspace();
                  else typeChar(keyText);
                  hoverMap.delete(el);
                }
              } else {
                el.classList.remove("gesture-key-active");
                hoverMap.delete(el);
              }
            }

            // Fist detection
            const tips = [4, 8, 12, 16, 20];
            let sum = 0;
            tips.forEach((i) => {
              const d = Math.hypot(
                landmarks[i].x - wrist.x,
                landmarks[i].y - wrist.y
              );
              sum += d;
            });
            const avg = sum / tips.length;

            if (avg < 0.08) {
              if (!fistStart) fistStart = Date.now();
              else if (Date.now() - fistStart > 700) {
                backspace();
                fistStart = null;
              }
            } else {
              fistStart = null;
            }

            // Open palm for SPACE
            if (avg > 0.22) {
              if (!spaceStart) spaceStart = Date.now();
              else if (Date.now() - spaceStart > 700) {
                typeChar("SPACE");
                spaceStart = null;
              }
            } else {
              spaceStart = null;
            }
          }
        });

        camera = new window.Camera(video, {
          onFrame: async () => {
            if (!hands) return;
            if (video.readyState >= 2) {
              await hands.send({ image: video });
            }
          },
          width: canvas.width,
          height: canvas.height,
        });

        camera.start();
        setGestureStatus("Gesture keyboard active ✔");
      } catch (err) {
        console.error("Error setting up gestures:", err);
        setMediapipeAvailable(false);
        setGestureStatus("Gesture keyboard disabled due to setup error.");
      }
    }

    setup();

    return () => {
      running = false;
      try {
        if (camera && camera.stop) camera.stop();
      } catch (e) {}
      try {
        if (hands && hands.close) hands.close();
      } catch (e) {}
      try {
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach((t) => t.stop());
        }
      } catch (e) {}
    };
  }, [currentIndex]);

  // ----------- GRAPH DATA PREP -----------
  const gapData = keystrokeLog
    .filter((d) => d.gap != null)
    .map((d, idx) => ({ ...d, index: idx }));

  const graphWidth = 280;
  const graphHeight = 100;

  let graphPoints = "";
  let maxGap = 0;

  if (gapData.length > 0) {
    maxGap = gapData.reduce((m, d) => Math.max(m, d.gap), 0);
    const usableWidth = graphWidth - 20;
    const usableHeight = graphHeight - 20;

    graphPoints = gapData
      .map((d, idx) => {
        const x =
          (idx / Math.max(gapData.length - 1, 1)) * usableWidth + 10;
        const y =
          graphHeight - (d.gap / (maxGap || 1)) * usableHeight - 10;
        return `${x},${y}`;
      })
      .join(" ");
  }

  // ----------- RENDER -----------
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[`Q${currentIndex + 1}`] || "";

  return (
    <div style={styles.page}>
      <div style={styles.examContainer}>
        {/* Webcam + Canvas */}
        <div style={styles.webcamWrapper}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
          <canvas ref={canvasRef} style={styles.canvas} />
          <div style={styles.statusBadge}>{gestureStatus}</div>
        </div>

        {/* Questions Panel */}
        <div style={styles.questionPanel}>
          <h2 style={styles.panelTitle}>Exam Questions</h2>

          {loadingQuestions && (
            <p style={styles.infoText}>Loading questions...</p>
          )}
          {questionsError && <p style={styles.errorText}>{questionsError}</p>}

          {!loadingQuestions && !questionsError && currentQuestion && (
            <>
              <p style={styles.questionText}>
                <strong>Q{currentIndex + 1}.</strong>{" "}
                {currentQuestion.question ||
                  currentQuestion.q ||
                  "Untitled"}
              </p>

              {/* MCQ options (if present) */}
              {currentQuestion.options && (
                <div style={styles.optionsBox}>
                  <div style={styles.optionRow}>
                    <span style={styles.optionLabel}>A.</span>
                    <span>{currentQuestion.options.a}</span>
                  </div>
                  <div style={styles.optionRow}>
                    <span style={styles.optionLabel}>B.</span>
                    <span>{currentQuestion.options.b}</span>
                  </div>
                  <div style={styles.optionRow}>
                    <span style={styles.optionLabel}>C.</span>
                    <span>{currentQuestion.options.c}</span>
                  </div>
                  <div style={styles.optionRow}>
                    <span style={styles.optionLabel}>D.</span>
                    <span>{currentQuestion.options.d}</span>
                  </div>
                </div>
              )}

              <textarea
                ref={answerRef}
                value={currentAnswer}
                onChange={handleAnswerChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Answer here (you can also use gestures)…"
                style={styles.textarea}
              />

              <div style={styles.navRow}>
                <button
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  style={{
                    ...styles.navButton,
                    opacity: currentIndex === 0 ? 0.4 : 1,
                  }}
                >
                  Previous
                </button>
                <span style={styles.questionCounter}>
                  {currentIndex + 1} / {questions.length || 1}
                </span>
                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  style={{
                    ...styles.navButton,
                    opacity:
                      currentIndex === questions.length - 1 ? 0.4 : 1,
                  }}
                >
                  Next
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !questions.length}
                style={{
                  ...styles.submitButton,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting…" : "Submit Exam"}
              </button>

              {submitMessage && (
                <p
                  style={
                    submitMessage.startsWith("✅")
                      ? styles.successText
                      : styles.errorText
                  }
                >
                  {submitMessage}
                </p>
              )}

              {/* ------- NEW: Graph box ------- */}
              {gapData.length > 1 && (
                <div style={styles.graphBox}>
                  <div style={styles.graphTitle}>
                    Time gap between letters (seconds)
                  </div>
                  <svg
                    width={graphWidth}
                    height={graphHeight}
                    style={styles.graphSvg}
                  >
                    {/* X-axis */}
                    <line
                      x1="10"
                      y1={graphHeight - 10}
                      x2={graphWidth - 5}
                      y2={graphHeight - 10}
                      stroke="#4b5563"
                      strokeWidth="1"
                    />
                    {/* Y-axis */}
                    <line
                      x1="10"
                      y1="10"
                      x2="10"
                      y2={graphHeight - 10}
                      stroke="#4b5563"
                      strokeWidth="1"
                    />

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
                      Max gap: {maxGap.toFixed(2)} s
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Virtual Keyboard */}
        <div style={styles.keyboardWrapper}>
          {keyboardRows.map((row, rIndex) => (
            <div key={rIndex} style={styles.keyboardRow}>
              {row.split("").map((ch) => (
                <div
                  key={ch}
                  className="gesture-key"
                  data-key={ch}
                  style={styles.key}
                >
                  {ch}
                </div>
              ))}
            </div>
          ))}
          <div style={styles.keyboardRow}>
            <div
              className="gesture-key"
              data-key="BACK"
              style={{ ...styles.key, minWidth: 80 }}
            >
              ⌫
            </div>
            <div
              className="gesture-key"
              data-key="SPACE"
              style={{ ...styles.key, flex: 1 }}
            >
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

// ----------- STYLES -----------
const styles = {
  page: {
    height: "100vh",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "10px",
    boxSizing: "border-box",
  },
  examContainer: {
    position: "relative",
    height: "100%",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.5)",
    background:
      "radial-gradient(circle at top left, #1d4ed8 0, #020617 45%, #000 100%)",
  },
  webcamWrapper: {
    position: "absolute",
    inset: 0,
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.95)",
  },
  canvas: {
    position: "absolute",
    inset: 0,
  },
  statusBadge: {
    position: "absolute",
    left: 16,
    top: 16,
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(148,163,184,0.8)",
    fontSize: "11px",
    maxWidth: "260px",
  },
  questionPanel: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 340,
    maxWidth: "90vw",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: "16px",
    padding: "14px 16px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
    border: "1px solid rgba(148,163,184,0.7)",
    boxSizing: "border-box",
  },
  panelTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "6px",
  },
  questionText: {
    fontSize: "14px",
    marginBottom: "6px",
  },
  optionsBox: {
    marginBottom: "8px",
    padding: "6px 8px",
    borderRadius: "8px",
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid #4b5563",
  },
  optionRow: {
    display: "flex",
    gap: 6,
    marginBottom: 2,
    fontSize: "13px",
  },
  optionLabel: {
    fontWeight: "600",
    minWidth: 18,
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
    borderRadius: "8px",
    border: "1px solid #4b5563",
    padding: "8px",
    fontSize: "13px",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    resize: "vertical",
    boxSizing: "border-box",
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "8px",
  },
  navButton: {
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid #4b5563",
    backgroundColor: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    fontSize: "12px",
    cursor: "pointer",
  },
  questionCounter: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  submitButton: {
    marginTop: "10px",
    width: "100%",
    padding: "8px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#22c55e",
    color: "#022c22",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  infoText: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  errorText: {
    fontSize: "12px",
    color: "#fecaca",
    marginTop: "4px",
  },
  successText: {
    fontSize: "12px",
    color: "#bbf7d0",
    marginTop: "4px",
  },
  keyboardWrapper: {
    position: "absolute",
    left: "50%",
    bottom: 12,
    transform: "translateX(-50%)",
    width: "92%",
    maxWidth: 900,
    backgroundColor: "rgba(15,23,42,0.92)",
    borderRadius: "18px",
    padding: "10px 14px 12px",
    border: "1px solid rgba(148,163,184,0.7)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
    boxSizing: "border-box",
  },
  keyboardRow: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    marginBottom: 6,
  },
  key: {
    minWidth: 44,
    padding: "10px 0",
    borderRadius: "999px",
    backgroundColor: "#1f2937",
    border: "1px solid #4b5563",
    textAlign: "center",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "default",
    userSelect: "none",
    color: "#e5e7eb",
    transition: "transform 0.12s ease, background-color 0.12s ease",
  },
  // NEW: Graph styles
  graphBox: {
    marginTop: "10px",
    padding: "8px 10px",
    borderRadius: "10px",
    backgroundColor: "rgba(15,23,42,0.95)",
    border: "1px solid #4b5563",
  },
  graphTitle: {
    fontSize: "12px",
    marginBottom: "4px",
    color: "#e5e7eb",
  },
  graphSvg: {
    display: "block",
    width: "100%",
    backgroundColor: "#020617",
    borderRadius: "6px",
  },
  graphFooter: {
    marginTop: 4,
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#9ca3af",
  },
  graphAxisLabel: {
    fontSize: "11px",
  },
};