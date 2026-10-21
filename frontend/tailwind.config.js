// =============================================================
// tailwind.config.js
// -------------------------------------------------------------
// Tells Tailwind which files to scan for class names, so it can
// generate only the CSS we actually use (keeps the bundle small).
// =============================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
