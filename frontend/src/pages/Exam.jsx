import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";


export default function Exam() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(null);
  const activeQuestionRef = useRef(null); // always holds latest active question
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [gestureInfo, setGestureInfo] = useState("Gesture keyboard loading...");

  // ⏱️ TIMER: 30 minutes = 1800 seconds
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const submittedRef = useRef(false); // to avoid double-submit

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ---------------- FETCH QUESTIONS ----------------
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const res = await axios.get("${API_BASE_URL}/api/questions");
        setQuestions(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load questions.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  // ---------------- ANSWER HANDLING ----------------
  function handleAnswerChange(index, value) {
    setAnswers((prev) => ({
      ...prev,
      ["Q" + (index + 1)]: value,
    }));
  }

  function handleFocusQuestion(index) {
    setActiveQuestion(index);
    activeQuestionRef.current = index;
  }

  // ---------------- VIRTUAL KEYBOARD ----------------
  const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  // uses ref + functional update so it always sees latest state
  function typeOnActive(key) {
    const index = activeQuestionRef.current;
    if (index === null || index === undefined) return;

    const qKey = "Q" + (index + 1);

    setAnswers((prev) => {
      const current = prev[qKey] || "";
      let next = current;

      if (key === "SPACE") {
        next = current + " ";
      } else if (key === "BACKSPACE") {
        next = current.slice(0, -1);
      } else if (key === "CLEAR") {
        next = "";
      } else {
        next = current + key;
      }

      return { ...prev, [qKey]: next };
    });
  }

  // helper to format time as mm:ss
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  // ---------------- SUBMIT EXAM ----------------
  async function handleSubmit(auto = false) {
    try {
      // prevent double-submit
      if (submittedRef.current) return;
      submittedRef.current = true;

      setStatus("");
      setError("");

      if (questions.length === 0) {
        setError("No questions to submit.");
        return;
      }

      let score = 0;
      questions.forEach((q, idx) => {
        const key = "Q" + (idx + 1);
        const userAns = (answers[key] || "").trim().toLowerCase();
        const correct = (q.answer || "").trim().toLowerCase();
        if (correct && userAns === correct) score++;
      });

      const rollNumber =
        localStorage.getItem("studentRollNumber") || "Unknown Roll";
      const name = localStorage.getItem("studentName") || "Student";

      const payload = {
        rollNumber,
        name,
        answers,
        score,
      };

      const res = await axios.post(
        "${API_BASE_URL}/api/submit-exam",
        payload
      );

      if (res.data.success) {
        if (auto) {
          setStatus(
            `⏳ Time over. Exam auto-submitted. Score: ${score}/${questions.length}`
          );
        } else {
          setStatus(
            `✅ Exam submitted successfully! Score: ${score}/${questions.length}`
          );
        }
      } else {
        setError("Failed to submit exam.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error while submitting exam.");
    }
  }

  // ---------------- TIMER LOGIC (AUTO SUBMIT) ----------------
  useEffect(() => {
    // if already submitted, stop timer
    if (submittedRef.current) return;

    if (timeLeft <= 0) {
      // time over → auto submit
      handleSubmit(true);
      return;
    }

    const id = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [timeLeft]); // runs every second

  // ---------------- GESTURE KEYBOARD (WEBCAM + MEDIAPIPE HANDS) ----------------
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");

    let stream = null;
    let hands = null;
    let rafId = null;
    let hoverKeyEl = null;
    let lastSelectTime = 0;

    // helper to load external script
    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () =>
          reject(new Error("Failed to load script: " + src));
        document.body.appendChild(s);
      });

    async function setup() {
      try {
        setGestureInfo("Starting webcam...");

        // start webcam
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });
        video.srcObject = stream;
        await video.play();

        // set canvas size to match video
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        setGestureInfo("Loading hand tracking...");

        // ✅ UPDATED URLs (no version numbers)
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        );

        // find correct constructor
        let HandsCtor =
          (window.Hands && window.Hands.Hands) || window.Hands || null;

        if (!HandsCtor) {
          console.warn("window.Hands contents:", window.Hands);
          throw new Error(
            "MediaPipe Hands class not found. CDN might have changed."
          );
        }

        hands = new HandsCtor({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        });

        hands.onResults(onResults);

        setGestureInfo(
          "✅ Gesture keyboard ready – focus a question, move your index finger over keys and pinch to type."
        );

        // main loop
        const loop = async () => {
          if (video.readyState >= 2 && hands) {
            await hands.send({ image: video });
          }
          rafId = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.error(err);
        setGestureInfo("⚠️ Gesture keyboard disabled: " + err.message);
      }
    }

    function onResults(results) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0)
        return;

      const landmarks = results.multiHandLandmarks[0];

      // draw landmarks if helpers exist
      const HAND_CONNECTIONS =
        (window.Hands && window.Hands.HAND_CONNECTIONS) ||
        window.HAND_CONNECTIONS;

      if (window.drawConnectors && window.drawLandmarks && HAND_CONNECTIONS) {
        try {
          window.drawConnectors(
            ctx,
            landmarks,
            HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 3 }
          );
          window.drawLandmarks(ctx, landmarks, {
            color: "#FF0000",
            lineWidth: 1,
          });
        } catch (e) {
          // ignore drawing errors
        }
      }

      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      const canvasX = indexTip.x * canvas.width;
      const canvasY = indexTip.y * canvas.height;

      // draw pointer
      ctx.fillStyle = "rgba(0, 123, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 10, 0, Math.PI * 2);
      ctx.fill();

      // convert to page coordinates to hit-test DOM keys
      const videoRect = video.getBoundingClientRect();
      const pageX = videoRect.left + indexTip.x * videoRect.width;
      const pageY = videoRect.top + indexTip.y * videoRect.height;

      const keyElems = Array.from(
        document.querySelectorAll(".gesture-key")
      );

      let currentlyHovered = null;

      keyElems.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          pageX >= rect.left &&
          pageX <= rect.right &&
          pageY >= rect.top &&
          pageY <= rect.bottom
        ) {
          currentlyHovered = el;
          el.style.backgroundColor = "#3b82f6";
          el.style.color = "#ffffff";
          el.style.transform = "scale(1.08)";
        } else {
          el.style.backgroundColor = "#e5e7eb";
          el.style.color = "#111827";
          el.style.transform = "scale(1.0)";
        }
      });

      const now = Date.now();

      // distance between thumb & index = pinch
      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const PINCH_THRESHOLD = 0.05;
      const COOLDOWN = 600; // ms

      if (currentlyHovered) {
        if (dist < PINCH_THRESHOLD && now - lastSelectTime > COOLDOWN) {
          const keyVal =
            currentlyHovered.dataset.key ||
            currentlyHovered.innerText.trim();
          typeOnActive(keyVal);
          lastSelectTime = now;

          // flash effect
          currentlyHovered.style.opacity = "0.7";
          setTimeout(() => {
            if (currentlyHovered) currentlyHovered.style.opacity = "1";
          }, 150);
        }
      }
    }

    setup();

    // cleanup
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (hands && hands.close) hands.close();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // run once, uses refs + functional setState so it's safe

  // ---------------- RENDER ----------------
  return (
    <div style={styles.page}>
      {error && <p style={styles.errorBanner}>{error}</p>}
      {status && !error && <p style={styles.statusBanner}>{status}</p>}

      {gestureInfo && (
        <div style={styles.gestureInfoBanner}>{gestureInfo}</div>
      )}

      {/* Timer badge */}
      <div style={styles.timerBadge}>⏳ Time Left: {formatTime(timeLeft)}</div>

      <div style={styles.fullScreenWrapper}>
        {/* Big Webcam */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={styles.webcam}
        />

        {/* Canvas overlay for hand drawing + pointer */}
        <canvas ref={canvasRef} style={styles.canvasOverlay} />

        {/* Dark gradient overlay at bottom (for keyboard contrast) */}
        <div style={styles.bottomOverlay} />

        {/* Virtual Keyboard overlay at bottom */}
        <div id="gesture-keyboard" style={styles.keyboardWrapper}>
          {keyboardRows.map((row, rIndex) => (
            <div key={rIndex} style={styles.keyboardRow}>
              {row.split("").map((ch, i) => (
                <div
                  key={i}
                  className="gesture-key"
                  data-key={ch}
                  style={styles.key}
                  onClick={() => typeOnActive(ch)}
                >
                  {ch}
                </div>
              ))}
            </div>
          ))}

          {/* Special keys row */}
          <div style={styles.keyboardRow}>
            <div
              className="gesture-key"
              data-key="SPACE"
              style={{ ...styles.key, flex: 3.5, fontSize: "22px" }}
              onClick={() => typeOnActive("SPACE")}
            >
              SPACE
            </div>
            <div
              className="gesture-key"
              data-key="BACKSPACE"
              style={{ ...styles.key, flex: 1.5, fontSize: "22px" }}
              onClick={() => typeOnActive("BACKSPACE")}
            >
              ⌫
            </div>
            <div
              className="gesture-key"
              data-key="CLEAR"
              style={{ ...styles.key, flex: 1.5, fontSize: "20px" }}
              onClick={() => typeOnActive("CLEAR")}
            >
              CLEAR
            </div>
          </div>
        </div>

        {/* Questions panel in corner */}
        <div style={styles.questionsPanel}>
          {loading && <p>Loading questions...</p>}

          {!loading && questions.length === 0 && (
            <p>No questions available. Contact admin.</p>
          )}

          {!loading && questions.length > 0 && (
            <>
              <h3 style={styles.panelTitle}>Questions</h3>
              <div style={styles.questionsScroll}>
                {questions.map((q, idx) => (
                  <div key={idx} style={styles.questionCard}>
                    <p style={styles.questionText}>
                      <b>Q{idx + 1}:</b> {q.question || q.q || "Question"}
                    </p>
                    <textarea
                      style={styles.textarea}
                      placeholder="Type your answer here..."
                      value={answers["Q" + (idx + 1)] || ""}
                      onChange={(e) =>
                        handleAnswerChange(idx, e.target.value)
                      }
                      onFocus={() => handleFocusQuestion(idx)}
                    />
                    {activeQuestion === idx && (
                      <p style={styles.activeHint}>
                        🔵 Keyboard / gestures typing here
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                style={styles.submitBtn}
                onClick={() => handleSubmit(false)}
              >
                Submit Exam
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#000",
    minHeight: "100vh",
    margin: 0,
    padding: 0,
    position: "relative",
    color: "#fff",
    fontFamily: "sans-serif",
  },
  fullScreenWrapper: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  },
  webcam: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  canvasOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30vh",
    background:
      "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)",
    pointerEvents: "none",
  },

  // BIGGER KEYBOARD
  keyboardWrapper: {
    position: "absolute",
    left: "50%",
    bottom: "2rem",
    transform: "translateX(-50%)",
    width: "95%",
    maxWidth: "1200px",
    padding: "18px",
    borderRadius: "22px",
    background: "rgba(15,23,42,0.95)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.65)",
  },
  keyboardRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  key: {
    flex: 1,
    minWidth: 55,
    maxWidth: 90,
    padding: "16px 10px",
    background: "#e5e7eb",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "20px",
    cursor: "pointer",
    userSelect: "none",
    color: "#111827",
    transition:
      "transform 0.1s ease, background-color 0.1s ease, color 0.1s ease, opacity 0.1s ease",
  },

  // Questions panel
  questionsPanel: {
    position: "absolute",
    top: "1.25rem",
    right: "1.25rem",
    width: "320px",
    maxHeight: "75vh",
    padding: "12px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
  },
  questionsScroll: {
    marginTop: "6px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  questionCard: {
    marginBottom: "8px",
    padding: "6px",
    borderRadius: "8px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  questionText: {
    marginBottom: "4px",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    minHeight: "55px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    padding: "6px",
    resize: "vertical",
    fontSize: "13px",
  },
  submitBtn: {
    marginTop: "6px",
    padding: "8px 12px",
    background: "#16a34a",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    alignSelf: "flex-end",
    fontSize: "14px",
  },
  activeHint: {
    fontSize: "11px",
    color: "#2563eb",
    marginTop: "3px",
  },
  errorBanner: {
    position: "absolute",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(239,68,68,0.9)",
    padding: "6px 12px",
    borderRadius: "999px",
    zIndex: 40,
    fontSize: "13px",
  },
  statusBanner: {
    position: "absolute",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(22,163,74,0.9)",
    padding: "6px 12px",
    borderRadius: "999px",
    zIndex: 40,
    fontSize: "13px",
  },
  gestureInfoBanner: {
    position: "absolute",
    bottom: 8,
    left: 8,
    padding: "6px 10px",
    background: "rgba(15,23,42,0.8)",
    borderRadius: "999px",
    fontSize: "12px",
    zIndex: 40,
  },
  timerBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: "6px 12px",
    background: "rgba(15,23,42,0.9)",
    borderRadius: "999px",
    fontSize: "13px",
    zIndex: 50,
    border: "1px solid rgba(148,163,184,0.7)",
  },
  panelTitle: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "2px",
  },
};
