// --------------------------------------
// IMPORTS
// --------------------------------------
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); // allow base64 images

// --------------------------------------
// CONNECT MONGODB
// --------------------------------------
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("📌 MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --------------------------------------
// FOLDERS
// --------------------------------------
const SNAPSHOT_DIR = path.join(__dirname, "uploads", "snapshots");

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

// --------------------------------------
// SCHEMAS
// --------------------------------------
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: { a: String, b: String, c: String, d: String },
  answer: String,
});

const ResultSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  answers: Object,
  score: Number,
  submittedAt: String,
  snapshots: [String], // 🆕 array of snapshot file paths
});
const SnapshotSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  imageData: String, // Base64 image
  capturedAt: String,
});

const Snapshot = mongoose.model("Snapshot", SnapshotSchema);
const Question = mongoose.model("Question", QuestionSchema);
const Result = mongoose.model("Result", ResultSchema);

// --------------------------------------
// ADMIN LOGIN
// --------------------------------------
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  return res.json({
    success: username === ADMIN_USERNAME && password === ADMIN_PASSWORD,
  });
});

// --------------------------------------
// STUDENT LOGIN
// --------------------------------------
app.post("/api/student-login", (req, res) => {
  const { name, rollNumber } = req.body || {};
  if (!name || !rollNumber)
    return res.json({ success: false, error: "Missing fields" });
  return res.json({ success: true });
});

// --------------------------------------
// GET QUESTIONS
// --------------------------------------
app.get("/api/questions", async (req, res) => {
  try {
    res.json(await Question.find({}));
  } catch (err) {
    res.json([]);
  }
});

// --------------------------------------
// UPLOAD QUESTIONS
// --------------------------------------
const upload = multer({ dest: path.join(__dirname, "uploads") });

app.post("/api/upload-questions", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: "No file" });
    const data = JSON.parse(fs.readFileSync(req.file.path, "utf8"));
    await Question.deleteMany({});
    await Question.insertMany(data);
    fs.unlinkSync(req.file.path);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: "Invalid file format" });
  }
});

// --------------------------------------
// SNAPSHOT UPLOAD (Base64)
// --------------------------------------
app.post("/api/upload-snapshot", async (req, res) => {
  try {
    const { name, rollNumber, imageData } = req.body;
    if (!name || !rollNumber || !imageData) {
      return res.json({ success: false, error: "Missing fields" });
    }

    await Snapshot.create({
      name,
      rollNumber,
      imageData,
      capturedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Snapshot upload error:", err);
    res.json({ success: false });
  }
});
app.get("/api/snapshots", async (req, res) => {
  try {
    const list = await Snapshot.find({}).sort({ capturedAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Fetch snapshot error:", err);
    res.json([]);
  }
});
// --------------------------------------
// SUBMIT EXAM
// --------------------------------------
app.post("/api/submit-exam", async (req, res) => {
  try {
    const submission = req.body;
    submission.submittedAt = new Date().toISOString();
    await Result.create(submission);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// --------------------------------------
// GET RESULTS
// --------------------------------------
app.get("/api/results", async (req, res) => {
  try {
    res.json(await Result.find({}));
  } catch {
    res.json([]);
  }
});

// --------------------------------------
// START SERVER
// --------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Server running on port " + PORT));
