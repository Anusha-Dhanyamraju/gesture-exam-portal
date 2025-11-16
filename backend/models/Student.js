const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name: String,
  rollNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model("Student", StudentSchema);
