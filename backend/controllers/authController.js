// =============================================================
// controllers/authController.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Contains the logic for user registration and login.
//
// WHY WE NEED IT:
// Controllers hold the actual "business logic" for a route.
// The route file just says "when this URL is hit, call this
// controller function" - it doesn't contain the logic itself.
// =============================================================

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// -------------------------------------------------------------
// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
// -------------------------------------------------------------
async function registerUser(req, res) {
  try {
    // Get the fields the user submitted in the request body
    const { name, email, password } = req.body;

    // Basic validation - make sure nothing is missing
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // NEVER store plain text passwords.
    // bcrypt.genSalt() creates random "salt" data to make the hash unique
    // even if two users pick the same password.
    const salt = await bcrypt.genSalt(10);

    // bcrypt.hash() combines the password + salt into a secure hash
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user in MongoDB with the hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate a JWT so the user is immediately logged in after registering
    const token = generateToken(user._id);

    // Send back user info (WITHOUT the password) + token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
}

// -------------------------------------------------------------
// @desc   Login an existing user
// @route  POST /api/auth/login
// @access Public
// -------------------------------------------------------------
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      // We intentionally give a generic error message (not "email not found")
      // so attackers can't figure out which emails are registered.
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // bcrypt.compare() hashes the submitted password with the same
    // algorithm and checks if it matches the stored hash.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Password matches - generate a fresh token
    const token = generateToken(user._id);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
}

module.exports = { registerUser, loginUser };
