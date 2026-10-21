// =============================================================
// models/User.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Defines the "shape" of a User document in MongoDB.
//
// WHY WE NEED IT:
// Mongoose needs a "Schema" to know what fields a User has,
// what type each field is, and any validation rules.
// =============================================================

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // The user's display name
    name: {
      type: String,
      required: true,
      trim: true, // removes extra whitespace like "  John  " -> "John"
    },

    // Email must be unique so two users can't register with the same one
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // always store emails in lowercase to avoid duplicates
      trim: true,
    },

    // We NEVER store plain text passwords.
    // This field stores the bcrypt-hashed password.
    password: {
      type: String,
      required: true,
    },
    
    // We will save the filename of the uploaded PDF here
    resumeFilename: {
      type: String,
      default: null,
    },
  },
  {
    // Automatically adds "createdAt" and "updatedAt" fields
    timestamps: true,
  }
);

// "User" here becomes the MongoDB collection name "users" (lowercase + plural)
module.exports = mongoose.model("User", userSchema);
