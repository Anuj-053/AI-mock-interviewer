// =============================================================
// config/db.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// This file is responsible for connecting our backend to MongoDB.
//
// WHY WE NEED IT:
// We only want ONE place in the whole app where we set up the
// database connection. Every other file will just "require" our
// Mongoose models, and Mongoose will use this same connection.
// =============================================================

const mongoose = require("mongoose");

// This is an async function because connecting to a database
// takes time (it's a network operation), so we "await" it.
const connectDB = async () => {
  try {
    // mongoose.connect() takes the connection string from .env
    // and opens a connection to our MongoDB database.
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    // If the connection fails (wrong URI, MongoDB not running, etc.)
    // we log the error and stop the whole server, because the app
    // cannot function without a database.
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // 1 means "exit with an error"
  }
};

module.exports = connectDB;
