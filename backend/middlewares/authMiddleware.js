// =============================================================
// middlewares/authMiddleware.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// This is Express "middleware" - a function that runs BEFORE
// the actual route handler. It checks if the incoming request
// has a valid JWT token. If yes, it lets the request continue.
// If no, it blocks the request with a 401 error.
//
// WHY WE NEED IT:
// Routes like "upload resume" or "start interview" should only
// be accessible to logged-in users. We don't want to repeat this
// check in every single controller, so we write it once here and
// reuse it on any route that needs protection.
// =============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// req  = incoming request
// res  = outgoing response
// next = function to call to continue to the next middleware/route handler
async function protect(req, res, next) {
  let token;

  // JWT tokens are usually sent in the "Authorization" header
  // in the format: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    try {
      // Split "Bearer xxxxx.yyyyy.zzzzz" into ["Bearer", "xxxxx.yyyyy.zzzzz"]
      // and take the second part - the actual token string
      token = authHeader.split(" ")[1];

      // jwt.verify() checks that:
      // 1) the token was signed with OUR secret (not tampered with)
      // 2) the token hasn't expired
      // If valid, it returns the original payload we signed (the user id)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Look up the user in MongoDB using the id from the token.
      // We exclude the password field using "-password" for security.
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Everything checks out - let the request continue to the actual route
      next();
    } catch (error) {
      // This runs if the token is invalid, tampered with, or expired
      console.error("Auth error:", error.message);
      res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    // No "Authorization" header was sent at all
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
}

module.exports = protect;
