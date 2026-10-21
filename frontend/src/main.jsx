// =============================================================
// main.jsx
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// The very first file that runs in our React app. It finds the
// <div id="root"> in index.html and renders our <App /> inside it.
// =============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
