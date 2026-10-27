// =============================================================
// server.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// This is the ENTRY POINT of our backend application. It:
//   1) Loads environment variables
//   2) Connects to MongoDB
//   3) Sets up Express middleware (CORS, JSON parsing)
//   4) Registers all our route groups
//   5) Starts the server listening on a port
//
// WHY WE NEED IT:
// Every Node/Express app needs one main file that wires
// everything together and actually starts the server.
// =============================================================

// Load variables from .env into process.env - must be the very first thing
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");

// Ensure temporary uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const savedQuestionRoutes = require("./routes/savedQuestionRoutes");

// Connect to MongoDB before anything else
connectDB();

const app = express();

// -------------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------------

// Allows our React frontend (running on a different port) to
// make requests to this backend without being blocked by the browser
app.use(cors());

// Automatically parses incoming JSON request bodies into req.body
app.use(express.json());

// GLOBAL LOGGER
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
    next();
});

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------
// Every route inside authRoutes.js will be prefixed with /api/auth
app.use("/api/auth", authRoutes);

// Every route inside resumeRoutes.js will be prefixed with /api/resume
app.use("/api/resume", resumeRoutes);

// Every route inside interviewRoutes.js will be prefixed with /api/interview
app.use("/api/interview", interviewRoutes);

app.use("/api/saved-questions", savedQuestionRoutes);

// A simple health-check route to confirm the server is running
app.get("/", (req, res) => {
  res.send("AI Resume Interviewer API is running ✅");
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
