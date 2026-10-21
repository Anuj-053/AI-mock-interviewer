// =============================================================
// routes/authRoutes.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Defines the URL paths for authentication and connects them
// to the correct controller functions.
//
// WHY WE NEED IT:
// Keeping routes separate from controllers keeps the codebase
// organized - routes = "which URL", controllers = "what happens".
// =============================================================

const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// POST /api/auth/register -> create a new account
router.post("/register", registerUser);

// POST /api/auth/login -> log in to an existing account
router.post("/login", loginUser);

module.exports = router;
