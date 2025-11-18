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
app.use(express.json());

// Ensure local storage paths exist (used when MongoDB is unavailable)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const QUESTIONS_FILE = path.join(uploadsDir, "questions.json");
const RESULTS_FILE = path.join(__dirname, "results.json");

function readJsonSafe(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonSafe(filePath, payload) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// -------------------------------------------------------
// MONGODB CONNECTION  (Direct URL, no .env required)
// -------------------------------------------------------
const MONGO_URL =
  "mongodb+srv://examUser:examUser123@gestureexamdb.ebpsncf.mongodb.net/GestureExamDB?retryWrites=true&w=majority&appName=gestureexamdb";
// --------------------------------------
// CONNECT MONGODB
// --------------------------------------
const DEFAULT_MONGO_URL =
  "mongodb+srv://examUser:examUser123@gestureexamdb.ebpsncf.mongodb.net/?appName=GestureExamDB";
const DEFAULT_DB_NAME = "GestureExamDB";

const MONGO_URL = process.env.MONGO_URL || DEFAULT_MONGO_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || DEFAULT_DB_NAME;
let mongoReady = false;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("📌 MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));
if (MONGO_URL) {
  mongoose
    .connect(MONGO_URL, {
      dbName: MONGO_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      mongoReady = true;
      console.log("📌 MongoDB Connected");
    })
    .catch((err) => {
      mongoReady = false;
      console.error("❌ MongoDB connection failed:", err.message);
      console.warn("➡️ Falling back to local JSON storage.");
    });

  mongoose.connection.on("connected", () => {
    mongoReady = true;
  });
  mongoose.connection.on("error", (err) => {
    mongoReady = false;
    console.error("MongoDB error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    mongoReady = false;
    console.warn("MongoDB disconnected. Local JSON storage will be used.");
  });
}

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
// --------------------------------------
// MULTER: File Upload
// --------------------------------------
const upload = multer({ dest: uploadsDir });

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
// --------------------------------------
// GET QUESTIONS
// --------------------------------------
app.get("/api/questions", async (req, res) => {
  try {
    const data = await Question.find({});
    res.json(data);
  } catch (err) {
    console.log("Fetch questions error:", err);
    res.json([]);
  if (mongoReady) {
    try {
      const data = await Question.find({});
      return res.json(data);
    } catch (err) {
      console.error("Error fetching questions from MongoDB:", err);
    }
  }

  const data = readJsonSafe(QUESTIONS_FILE, []);
  return res.json(data);
});

// -------------------------------------------------------
// UPLOAD QUESTIONS JSON FILE
// -------------------------------------------------------
// --------------------------------------
// UPLOAD QUESTIONS JSON FILE
// --------------------------------------
app.post("/api/upload-questions", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, error: "No file uploaded." });
  }

  try {
    if (!req.file) return res.json({ success: false, error: "No file uploaded" });

    const fileData = fs.readFileSync(req.file.path, "utf8");
    const parsed = JSON.parse(fileData);
    const data = fs.readFileSync(req.file.path, "utf8");
    const parsed = JSON.parse(data);

    await Question.deleteMany({});
    await Question.insertMany(parsed);

    fs.unlinkSync(req.file.path);
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error("JSON must be a non-empty array of questions.");
    }

    if (mongoReady) {
      await Question.deleteMany({});
      await Question.insertMany(parsed);
    } else {
      writeJsonSafe(QUESTIONS_FILE, parsed);
    }

    res.json({ success: true });
  } catch (err) {
    console.log("Upload error:", err);
    res.json({ success: false, error: "Invalid JSON format" });
    console.error("Upload questions error:", err);
    res.json({
      success: false,
      error: err.message || "Unable to process JSON file.",
    });
  } finally {
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupErr) {
      // Ignore cleanup errors
    }
  }
});

// -------------------------------------------------------
// SUBMIT EXAM
// -------------------------------------------------------
// --------------------------------------
// SUBMIT EXAM
// --------------------------------------
app.post("/api/submit-exam", async (req, res) => {
  try {
    const data = req.body;
    data.submittedAt = new Date().toISOString();
    const submission = {
      ...req.body,
      submittedAt: new Date().toISOString(),
    };

    await Result.create(data);
    if (mongoReady) {
      await Result.create(submission);
    } else {
      const existing = readJsonSafe(RESULTS_FILE, []);
      existing.push(submission);
      writeJsonSafe(RESULTS_FILE, existing);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Submit exam error:", err);
    res.json({
      success: false,
      error: "Unable to store submission. Please try again.",
    });
  }
});

// -------------------------------------------------------
// GET RESULTS (Admin)
// -------------------------------------------------------
app.get("/api/results", async (req, res) => {
  if (mongoReady) {
    try {
      const data = await Result.find({});
      return res.json(data);
    } catch (err) {
      console.error("Fetch results error (MongoDB):", err);
    }
  }

  const data = readJsonSafe(RESULTS_FILE, []);
  return res.json(data);
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
