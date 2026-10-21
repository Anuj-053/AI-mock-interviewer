// =============================================================
// components/Navbar.jsx
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// A simple top navigation bar shown on every page, with the
// app name and a logout button (only shown if logged in).
// =============================================================

import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Clears the saved token and user info, then redirects to login
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <span className="font-semibold text-lg text-gray-800">
        AI Resume Interviewer
      </span>

      {token && (
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100"
        >
          Logout
        </button>
      )}
    </nav>
  );
}

export default Navbar;
