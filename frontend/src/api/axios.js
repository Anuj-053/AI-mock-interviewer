// =============================================================
// api/axios.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Creates ONE shared Axios instance that all our pages use to
// talk to the backend, and automatically attaches the user's
// JWT token to every request.
//
// WHY WE NEED IT:
// Without this, we'd have to manually add the Authorization
// header on every single API call in every page. Doing it once
// here keeps our page components clean.
// =============================================================

import axios from "axios";

let rawBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
rawBaseURL = rawBaseURL.trim();
if (!rawBaseURL.endsWith('/api') && !rawBaseURL.endsWith('/api/')) {
    rawBaseURL = rawBaseURL.replace(/\/+$/, '') + '/api';
}

// Base URL of our Express backend
const api = axios.create({
  baseURL: rawBaseURL,
});

// An "interceptor" runs before every request is sent.
// Here we check localStorage for a saved token and attach it.
api.interceptors.request.use((config) => {
  let token = localStorage.getItem("token");
  if (!token) {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (userInfo && userInfo.token) {
        token = userInfo.token;
      }
    } catch (e) {
      // ignore JSON parse error
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
