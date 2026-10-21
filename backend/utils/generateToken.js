// =============================================================
// utils/generateToken.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Creates a signed JWT (JSON Web Token) for a given user ID.
//
// WHY WE NEED IT:
// After login/register, we need to give the frontend a token
// that PROVES who the user is on future requests, without
// requiring them to send their password every time.
// =============================================================

const jwt = require("jsonwebtoken");

// userId: the MongoDB _id of the user we are creating a token for
function generateToken(userId) {
  // jwt.sign(payload, secret, options)
  // - payload: the data we want to store inside the token (just the user id)
  // - secret: a private key only our server knows, used to verify the token later
  // - expiresIn: token becomes invalid after this time, forcing re-login
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token is valid for 7 days
  });
}

module.exports = generateToken;
