import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function Exam() {
  const navigate = useNavigate();
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
    "Gesture keyboard starting..."
  );
  const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  // ---------- Keystroke Timing ----------
  const [keystrokeLog, setKeystrokeLog] = useState([]);
  const lastKeyTimeRef = useRef(null);

  // For AI-style prediction smoothing
  const lastPredictedKeyRef = useRef(null);
  const lastPredictionTimeRef = useRef(0);
  const currentIndexRef = useRef(0);

  function logKeypress(source, keyLabel) {
    const now = performance.now();
    let gap = null;
    if (lastKeyTimeRef.current !== null) {
      gap = (now - lastKeyTimeRef.current) / 1000;
    }
    lastKeyTimeRef.current = now;

    setKeystrokeLog((prev) => [
      ...prev,
      { question: currentIndex + 1, source, key: keyLabel, time: now, gap }
    ]);
  }

  // ---------- Load Questions ----------
  useEffect(() => {
    async function load() {
      setLoadingQuestions(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setQuestions(res.data);
        } else {
          setQuestionsError("No questions found. Contact admin.");
        }
      } catch (err) {
        setQuestionsError("Failed to load questions.");
      } finally {
        setLoadingQuestions(false);
      }
    }
    load();
  }, []);

  // ---------- Answer typing ----------
  function handleAnswerChange(e) {
    const value = e.target.value.toLowerCase().slice(-1); // only last char
    setAnswers((prev) => ({
      ...prev,
      [`Q${currentIndex + 1}`]: value
    }));
  }

  function handleTextKey(e) {
    const key = e.key.toLowerCase();
    if (["a", "b", "c", "d"].includes(key)) {
      logKeypress("physical", key);
    }
  }

  // ---------- Navigation ----------
  function goTo(i) {
    if (i < 0 || i >= questions.length) return;
    setCurrentIndex(i);
    setSubmitMessage("");
  }

  // Keep ref in sync so gesture effect (which runs once) always knows latest index
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // ---------- Submit ----------
  async function handleSubmit() {
    if (!window.confirm("Submit exam?")) return;

    setSubmitting(true);
    try {
      let score = 0;
      questions.forEach((q, i) => {
        const ans = answers[`Q${i + 1}`];
        if (ans && ans === q.answer?.toLowerCase()) score++;
      });

      const payload = {
        name: localStorage.getItem("studentName") || "Student",
        rollNumber: localStorage.getItem("studentRollNumber") || "Unknown",
        answers,
        score
      };

      const res = await axios.post(`${API_BASE_URL}/api/submit-exam`, payload);
      if (res.data.success) {
        setSubmitMessage(`✅ Submitted! Score: ${score}/${questions.length}`);
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setSubmitMessage("❌ Failed to submit exam.");
        setSubmitting(false);
      }
    } catch {
      setSubmitMessage("❌ Error submitting exam.");
      setSubmitting(false);
    }
  }

  // ---------- Gesture Keyboard Setup ----------
  useEffect(() => {
    let hands;
    let camera;
    let running = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setGestureStatus("Video/canvas not ready");
      return;
    }

    const ctx = canvas.getContext("2d");

    async function start() {
      setGestureStatus("Starting camera...");
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" }
        });
        video.srcObject = stream;
        await video.play();
        setGestureStatus("Camera active, loading MediaPipe...");
      } catch (err) {
        console.error("Camera error:", err);
        setGestureStatus("Camera blocked. Please allow camera access.");
        return;
      }

      // Wait for video to have dimensions
      await new Promise((resolve) => {
        const checkSize = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve();
          } else {
            setTimeout(checkSize, 100);
          }
        };
        checkSize();
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log("Canvas size:", canvas.width, canvas.height);

      setGestureStatus("Loading MediaPipe scripts...");
      
      try {
        await Promise.all([
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js"
          ),
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js"
          ),
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js"
          )
        ]);
      } catch (err) {
        console.error("Script loading error:", err);
        setGestureStatus("Failed to load MediaPipe scripts");
        return;
      }

      // Wait a bit for globals to be available
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!window.Hands || !window.Camera || !window.drawConnectors || !window.drawLandmarks) {
        console.error("MediaPipe globals missing:", {
          Hands: typeof window.Hands,
          Camera: typeof window.Camera,
          drawConnectors: typeof window.drawConnectors,
          drawLandmarks: typeof window.drawLandmarks
        });
        setGestureStatus("MediaPipe not loaded properly");
        return;
      }

      setGestureStatus("Initializing hand detection...");

      try {
        hands = new window.Hands({
          locateFile: (f) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      } catch (err) {
        console.error("Hands initialization error:", err);
        setGestureStatus("Failed to initialize hand detection");
        return;
      }

      // Type a key into the input field
      function typeKey(key) {
        const idx = currentIndexRef.current;
        const questionKey = `Q${idx + 1}`;
        
        console.log("⌨️ Typing:", key, "for", questionKey);
        
        logKeypress("gesture", key);
        
        // Update state
        setAnswers((prev) => {
          const updated = {
            ...prev,
            [questionKey]: key.toLowerCase()
          };
          return updated;
        });
        
        // Update input field directly
        if (answerRef.current) {
          answerRef.current.value = key.toLowerCase();
          // Trigger onChange to sync with React
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(answerRef.current, key.toLowerCase());
          }
          const event = new Event('input', { bubbles: true });
          answerRef.current.dispatchEvent(event);
        }
      }

      // Track hover timing for auto-type
      let hoveredKey = null;
      let hoverStartTime = 0;
      const HOVER_DURATION = 1000; // 1 second in milliseconds

      hands.onResults((res) => {
        if (!running) return;

        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (!res.multiHandLandmarks || res.multiHandLandmarks.length === 0) {
            // No hand detected - show message
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "20px Arial";
            ctx.fillText("Show your hand to the camera", 50, 50);
            
            // Clear all keyboard highlights and reset hover
            document.querySelectorAll(".gesture-key").forEach((el) => {
              el.classList.remove("gesture-key-active");
            });
            hoveredKey = null;
            hoverStartTime = 0;
            return;
          }

          const landmarks = res.multiHandLandmarks[0];
          
          // Draw hand connections and landmarks
          try {
            if (window.drawConnectors && window.HAND_CONNECTIONS) {
              window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 2
              });
            }
            if (window.drawLandmarks) {
              window.drawLandmarks(ctx, landmarks, {
                color: "#FF0000",
                lineWidth: 1,
                radius: 3
              });
            }
          } catch (drawErr) {
            console.warn("Drawing error:", drawErr);
          }

          // Get index finger tip (landmark 8)
          const indexTip = landmarks[8];
          
          // Convert normalized coordinates to canvas pixels
          const indexX = indexTip.x * canvas.width;
          const indexY = indexTip.y * canvas.height;

          // Draw index finger tip
          ctx.fillStyle = "rgba(59,130,246,1)";
          ctx.beginPath();
          ctx.arc(indexX, indexY, 15, 0, Math.PI * 2);
          ctx.fill();

          // Get video element's position on page for coordinate conversion
          const videoRect = video.getBoundingClientRect();
          const pageX = videoRect.left + indexTip.x * videoRect.width;
          const pageY = videoRect.top + indexTip.y * videoRect.height;

          // Check which keyboard button is being hovered
          let currentHoveredKey = null;
          let hoveredElement = null;
          
          document.querySelectorAll(".gesture-key").forEach((el) => {
            const keyRect = el.getBoundingClientRect();
            const key = el.dataset.key;
            
            // Check if index finger is hovering over this key
            if (
              pageX >= keyRect.left &&
              pageX <= keyRect.right &&
              pageY >= keyRect.top &&
              pageY <= keyRect.bottom
            ) {
              currentHoveredKey = key;
              hoveredElement = el;
              el.classList.add("gesture-key-active");
              
              // Draw highlight on canvas
              ctx.strokeStyle = "rgba(175,0,175,1)";
              ctx.lineWidth = 4;
              ctx.strokeRect(
                keyRect.left - videoRect.left,
                keyRect.top - videoRect.top,
                keyRect.width,
                keyRect.height
              );
            } else {
              el.classList.remove("gesture-key-active");
            }
          });

          // Handle hover timing for auto-type
          const now = performance.now();
          
          if (currentHoveredKey) {
            // If hovering over the same key, check if we've been here long enough
            if (currentHoveredKey === hoveredKey) {
              const hoverDuration = now - hoverStartTime;
              const progress = Math.min(hoverDuration / HOVER_DURATION, 1);
              
              // Draw progress ring around the key
              if (hoveredElement) {
                const keyRect = hoveredElement.getBoundingClientRect();
                const centerX = keyRect.left - videoRect.left + keyRect.width / 2;
                const centerY = keyRect.top - videoRect.top + keyRect.height / 2;
                const radius = Math.max(keyRect.width, keyRect.height) / 2 + 10;
                
                // Progress ring
                ctx.strokeStyle = progress >= 1 ? "rgba(34,197,94,1)" : "rgba(59,130,246,0.8)";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
                ctx.stroke();
              }
              
              // Auto-type after 1 second
              if (hoverDuration >= HOVER_DURATION) {
                // Type the key
                typeKey(currentHoveredKey);
                
                // Visual feedback: green flash on the typed key
                if (hoveredElement) {
                  hoveredElement.style.backgroundColor = "#22c55e";
                  setTimeout(() => {
                    hoveredElement.style.backgroundColor = "";
                  }, 200);
                }
                
                // Reset hover timer to prevent rapid repeats
                hoverStartTime = now + 500; // Add delay before next type
              }
            } else {
              // New key hovered, start timer
              hoveredKey = currentHoveredKey;
              hoverStartTime = now;
            }
          } else {
            // Not hovering over any key, reset
            hoveredKey = null;
            hoverStartTime = 0;
          }

        } catch (err) {
          console.error("onResults error:", err);
        }
      });

      try {
        camera = new window.Camera(video, {
          onFrame: async () => {
            if (!hands || !running || !video) return;
            try {
              if (video.readyState >= 2) {
                await hands.send({ image: video });
              }
            } catch (err) {
              console.error("hands.send error:", err);
            }
          },
          width: canvas.width,
          height: canvas.height
        });
        camera.start();
        setGestureStatus("✅ Hand gestures active - Show your hand!");
        console.log("MediaPipe started successfully");
      } catch (err) {
        console.error("Camera start error:", err);
        setGestureStatus("Failed to start camera processing");
      }
    }

    start();

    return () => {
      running = false;
      try {
        if (camera && camera.stop) camera.stop();
      } catch {}
      try {
        if (hands && hands.close) hands.close();
      } catch {}
      try {
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach((t) => t.stop());
        }
      } catch {}
    };
  }, []);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => {
        console.log("Loaded:", src);
        resolve();
      };
      s.onerror = () => {
        console.error("Failed to load:", src);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(s);
    });
  }

  // ---------- Render ----------
  const q = questions[currentIndex];
  const ans = answers[`Q${currentIndex + 1}`] || "";

  return (
    <div style={styles.page}>
      <video ref={videoRef} autoPlay muted playsInline style={styles.video} />
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.statusBadge}>{gestureStatus}</div>
      <div style={styles.panel}>
        <h2>Question {currentIndex + 1} / {questions.length}</h2>

        {loadingQuestions && <p>Loading...</p>}
        {questionsError && <p style={styles.error}>{questionsError}</p>}

        {q && (
          <>
            <p style={styles.questionText}>{q.question}</p>
            <ul style={styles.options}>
              <li>A: {q.options?.a}</li>
              <li>B: {q.options?.b}</li>
              <li>C: {q.options?.c}</li>
              <li>D: {q.options?.d}</li>
            </ul>

            <input
              ref={answerRef}
              value={ans}
              maxLength={1}
              onChange={handleAnswerChange}
              onKeyDown={handleTextKey}
              placeholder="Type a / b / c / d"
              style={styles.input}
            />

            <div style={styles.nav}>
              <button disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>Prev</button>
              <button disabled={currentIndex === questions.length - 1} onClick={() => goTo(currentIndex + 1)}>Next</button>
            </div>

            <button onClick={handleSubmit} disabled={submitting} style={styles.submit}>
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
            {submitMessage && <p>{submitMessage}</p>}
          </>
        )}
      </div>

      {/* Keyboard */}
      <div style={styles.keyboard}>
        {keyboardRows.map((row, i) => (
          <div key={i} style={styles.keyRow}>
            {row.split("").map((c) => (
              <div className="gesture-key" data-key={c.toLowerCase()} key={c} style={styles.keyBtn}>{c}</div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .gesture-key-active {
          background:#2563eb !important;
          color:white !important;
          transform:scale(1.1);
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { position: "relative", height: "100vh", background: "#020617", color: "white", overflow: "hidden" },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, zIndex: 1 },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" },
  statusBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    padding: "8px 14px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(148,163,184,0.6)",
    fontSize: "12px",
    color: "#e5e7eb",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  },
  panel: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 350,
    background: "rgba(0,0,0,0.55)",
    padding: 15,
    borderRadius: 12,
    backdropFilter: "blur(4px)",
    zIndex: 5
  },
  questionText: { fontSize: 15, fontWeight: "600" },
  options: { fontSize: 13, lineHeight: 1.4 },
  input: { marginTop: 8, width: "100%", padding: 7, borderRadius: 6 },
  nav: { marginTop: 10, display: "flex", justifyContent: "space-between" },
  submit: { marginTop: 12, width: "100%", padding: 8, background: "#22c55e", borderRadius: 8, border: 0 },
  keyboard: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.7)",
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.6)",
    maxWidth: "90%",
    zIndex: 5
  },
  keyRow: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 },
  keyBtn: {
    padding: "12px 18px",
    minWidth: 44,
    borderRadius: 10,
    background: "#1e293b",
    border: "1px solid #475569",
    fontWeight: 700,
    fontSize: 16,
    cursor: "default"
  },
  error: { color: "#fecaca" }
};