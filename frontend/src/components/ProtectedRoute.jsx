// =============================================================
// components/ProtectedRoute.jsx
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// A wrapper component that checks if the user is logged in
// (i.e. has a token saved) BEFORE showing the page they asked for.
//
// WHY WE NEED IT:
// We don't want someone to visit "/dashboard" or "/interview"
// directly in the browser without logging in first. This
// component redirects them to "/login" if there's no token.
// =============================================================

import { Navigate } from "react-router-dom";

// children: whatever page component this route is protecting
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // If there's no token, redirect to the login page instead
  // of rendering the protected page.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists - show the requested page
  return children;
}

export default ProtectedRoute;
