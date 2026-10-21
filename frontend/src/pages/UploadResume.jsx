// =============================================================
// pages/UploadResume.jsx
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Lets the user pick a PDF file and upload it to the backend,
// which runs it through the whole RAG ingestion pipeline
// (extract -> chunk -> embed -> store in ChromaDB).
// =============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

function UploadResume() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Runs when the user selects a file in the <input type="file">
  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a PDF file first");
      return;
    }

    setUploading(true);

    try {
      // File uploads must be sent as "multipart/form-data",
      // which is what FormData automatically creates for us.
      const formData = new FormData();
      formData.append("resume", file); // "resume" must match upload.single("resume") on the backend

      await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Once uploaded and processed, go back to the dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-md mx-auto mt-16 px-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Upload Resume</h1>

        <form
          onSubmit={handleUpload}
          className="bg-white border border-gray-200 rounded p-6"
        >
          {error && (
            <p className="bg-red-50 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
          )}

          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm mb-4"
          />

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-gray-900 text-white py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {uploading ? "Processing resume..." : "Upload"}
          </button>

          {uploading && (
            <p className="text-xs text-gray-500 mt-3">
              Extracting text, generating embeddings, and storing them in
              ChromaDB. This may take a few seconds...
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default UploadResume;
