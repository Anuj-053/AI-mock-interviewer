// =============================================================
// services/pdfService.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Takes an uploaded PDF file and extracts its raw text content.
//
// WHY WE NEED IT:
// Our RAG pipeline needs plain text to chunk and embed. PDFs
// store text in a complex binary format, so we use the
// "pdf-parse" library to do the hard work of reading it.
//
// THIS IS STEP 1 OF THE RAG PIPELINE:
// Upload PDF -> [EXTRACT TEXT] -> Chunk -> Embed -> Store -> Retrieve -> LLM
// =============================================================

const fs = require("fs"); // Node's built-in file system module
const pdfParse = require("pdf-parse");

// filePath: the location on disk where Multer saved the uploaded PDF
// Returns: a single string containing all the text from the PDF
async function extractResumeText(filePath) {
  // Read the PDF file from disk into memory as raw binary data (a Buffer)
  const fileBuffer = fs.readFileSync(filePath);

  // pdfParse() reads the PDF buffer and returns an object containing,
  // among other things, a "text" property with all extracted text
  const data = await pdfParse(fileBuffer);

  // data.text often has messy spacing/line breaks from the PDF layout.
  // We do some light cleanup:
  const cleanedText = data.text
    .replace(/\r\n/g, "\n") // normalize Windows line breaks to Unix style
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ blank lines into just 2
    .trim(); // remove leading/trailing whitespace

  return cleanedText;
}

module.exports = { extractResumeText };
