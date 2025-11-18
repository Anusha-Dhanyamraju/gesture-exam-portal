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

  const [gestureStatus, setGestureStatus] = useState("Gesture keyboard starting...");
  const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  // ---------- Keystroke Timing ----------
  const [keystrokeLog, setKeystrokeLog] = useState([]);
  const lastKeyTimeRef = useRef(null);

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
      } else {
        setSubmitMessage("❌ Failed to submit exam.");
      }
    } catch {
      setSubmitMessage("❌ Error submitting exam.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Gesture Keyboard Setup ----------
  useEffect(() => {
    let hands, camera, running = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
      } catch {
        setGestureStatus("Camera blocked. Gesture typing disabled.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      await Promise.all([
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js"),
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"),
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js")
      ]);

      if (!window.Hands || !window.Camera) {
        setGestureStatus("Gesture not supported.");
        return;
      }

      hands = new window.Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`
      });

      hands.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      let hoverMap = new Map();

      function typeKey(k) {
        const allowed = ["a", "b", "c", "d"];
        if (!allowed.includes(k.toLowerCase())) return;
        logKeypress("gesture", k.toLowerCase());
        setAnswers((prev) => ({
          ...prev,
          [`Q${currentIndex + 1}`]: k.toLowerCase()
        }));
      }

      hands.onResults((res) => {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!(res.multiHandLandmarks?.length)) return;

        const lm = res.multiHandLandmarks[0];
        const index = lm[8];

        const r = video.getBoundingClientRect();
        const px = r.left + index.x * r.width;
        const py = r.top + index.y * r.height;

        document.querySelectorAll(".gesture-key").forEach((el) => {
          const rect = el.getBoundingClientRect();
          const key = el.dataset.key;

          if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
            el.classList.add("gesture-key-active");
            if (!hoverMap.has(key)) hoverMap.set(key, Date.now());
            if (Date.now() - hoverMap.get(key) > 550) {
              typeKey(key);
              hoverMap.delete(key);
            }
          } else {
            el.classList.remove("gesture-key-active");
            hoverMap.delete(key);
          }
        });
      });

      camera = new window.Camera(video, {
        onFrame: async () => hands.send({ image: video }),
        width: canvas.width,
        height: canvas.height
      });
      camera.start();
      setGestureStatus("Gesture keyboard active ✔");
    }

    start();

    return () => {
      running = false;
      try {
        video.srcObject?.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        camera?.stop();
      } catch {}
    };
  }, [currentIndex]);

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
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
  page: { position: "relative", height: "100vh", background: "#020617", color: "white" },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.23 },
  canvas: { position: "absolute", inset: 0 },
  panel: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 350,
    background: "rgba(0,0,0,0.55)",
    padding: 15,
    borderRadius: 12,
    backdropFilter: "blur(4px)"
  },
  questionText: { fontSize: 15, fontWeight: "600" },
  options: { fontSize: 13, lineHeight: 1.4 },
  input: { marginTop: 8, width: "100%", padding: 7, borderRadius: 6 },
  nav: { marginTop: 10, display: "flex", justifyContent: "space-between" },
  submit: { marginTop: 12, width: "100%", padding: 8, background: "#22c55e", borderRadius: 8, border: 0 },
  keyboard: {
    position: "absolute", bottom: 15, left: "50%", transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 12
  },
  keyRow: { display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 },
  keyBtn: {
    padding: "8px 14px", borderRadius: 8, background: "#1e293b", border: "1px solid #475569",
    fontWeight: "600", cursor: "default"
  },
  error: { color: "#fecaca" }
};