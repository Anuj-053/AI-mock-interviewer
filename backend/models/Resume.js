// =============================================================
// models/Resume.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Stores metadata ABOUT an uploaded resume.
//
// WHY WE NEED IT:
// We do NOT store the actual resume text or embeddings here.
// - The raw PDF text chunks + embeddings live in ChromaDB.
// - MongoDB only needs to know: which user uploaded a resume,
//   what the file was called, and a unique ID (resumeId) that
//   links this resume to its chunks inside ChromaDB.
// =============================================================

const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    // Which user this resume belongs to
    // "ref: User" lets us later do .populate('user') to get user details
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The original filename the user uploaded, e.g. "john_resume.pdf"
    fileName: {
      type: String,
      required: true,
    },

    // A unique ID we generate ourselves (using uuid) for this resume.
    // This same ID is used as a "tag" on the vectors we store in ChromaDB,
    // so when we retrieve chunks, we only retrieve THIS resume's chunks.
    resumeId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);
