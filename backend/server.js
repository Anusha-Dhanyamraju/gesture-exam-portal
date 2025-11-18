// -------------------------------------------------------
// Gesture Exam Portal - Working Server (No Snapshots)
// -------------------------------------------------------

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// -------------------------------------------------------
// MONGODB CONNECTION  (Direct URL, no .env required)
// -------------------------------------------------------
const MONGO_URL =
  "mongodb+srv://examUser:examUser123@gestureexamdb.ebpsncf.mongodb.net/GestureExamDB?retryWrites=true&w=majority&appName=gestureexamdb";

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("📌 MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// -------------------------------------------------------
// MONGOOSE MODELS
// -------------------------------------------------------
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: {
    a: String,
    b: String,
    c: String,
    d: String,
  },
  answer: String,
});

const ResultSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  answers: Object,
  score: Number,
  submittedAt: String,
});

const Question = mongoose.model("Question", QuestionSchema);
const Result = mongoose.model("Result", ResultSchema);

// -------------------------------------------------------
// MULTER FOR QUESTIONS JSON UPLOAD
// -------------------------------------------------------
const upload = multer({ dest: path.join(__dirname, "uploads") });

// -------------------------------------------------------
// ADMIN LOGIN
// -------------------------------------------------------
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.json({ success: false, error: "Invalid Credentials" });
});

// -------------------------------------------------------
// STUDENT LOGIN
// -------------------------------------------------------
app.post("/api/student-login", (req, res) => {
  const { name, rollNumber } = req.body;
  if (!name || !rollNumber) {
    return res.json({ success: false, error: "Missing fields" });
  }
  return res.json({ success: true });
});

// -------------------------------------------------------
// GET QUESTIONS
// -------------------------------------------------------
app.get("/api/questions", async (req, res) => {
  try {
    const data = await Question.find({});
    res.json(data);
  } catch (err) {
    console.log("Fetch questions error:", err);
    res.json([]);
  }
});

// -------------------------------------------------------
// UPLOAD QUESTIONS JSON FILE
// -------------------------------------------------------
app.post("/api/upload-questions", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: "No file uploaded" });

    const fileData = fs.readFileSync(req.file.path, "utf8");
    const parsed = JSON.parse(fileData);

    await Question.deleteMany({});
    await Question.insertMany(parsed);

    fs.unlinkSync(req.file.path);
    res.json({ success: true });
  } catch (err) {
    console.log("Upload error:", err);
    res.json({ success: false, error: "Invalid JSON format" });
  }
});

// -------------------------------------------------------
// SUBMIT EXAM
// -------------------------------------------------------
app.post("/api/submit-exam", async (req, res) => {
  try {
    const data = req.body;
    data.submittedAt = new Date().toISOString();

    await Result.create(data);

    res.json({ success: true });
  } catch (err) {
    console.log("Submit exam error:", err);
    res.json({ success: false });
  }
});

// -------------------------------------------------------
// GET RESULTS (Admin)
// -------------------------------------------------------
app.get("/api/results", async (req, res) => {
  try {
    const data = await Result.find({});
    res.json(data);
  } catch (err) {
    console.log("Fetch results error:", err);
    res.json([]);
  }
});

// -------------------------------------------------------
// HEALTH CHECK
// -------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server running fine 🚀" });
});

// -------------------------------------------------------
// START SERVER
// -------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
