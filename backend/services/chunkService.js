// =============================================================
// services/chunkService.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Splits a long piece of text (the resume) into smaller "chunks".
//
// WHY WE NEED IT:
// Embedding models and LLMs work best with small pieces of text.
// Also, in a REAL RAG system, we don't want to search over one
// giant blob of text - we want many small, focused chunks so the
// retriever can find the MOST relevant pieces later.
//
// THIS IS STEP 2 OF THE RAG PIPELINE:
// Upload PDF -> Extract Text -> [CHUNK TEXT] -> Embed -> Store -> Retrieve -> LLM
// =============================================================

// text: the full resume text (one long string)
// chunkSize: max number of characters per chunk
// overlap: how many characters from the end of one chunk are
//          repeated at the start of the next chunk. This helps
//          avoid losing context that falls right on a chunk boundary.
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];

  // First, split resume into paragraphs (blank-line separated).
  // This keeps related sentences (like one job entry) together
  // more naturally than just cutting every N characters.
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // If adding this paragraph would make the chunk too big,
    // save the current chunk and start a new one.
    if ((currentChunk + "\n" + paragraph).length > chunkSize) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }

      // Start the new chunk with the last bit of the previous chunk
      // (the "overlap") so we don't lose context between chunks.
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + "\n" + paragraph;
    } else {
      // Otherwise, just keep appending to the current chunk
      currentChunk += (currentChunk ? "\n" : "") + paragraph;
    }
  }

  // Don't forget the last chunk still sitting in currentChunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

module.exports = { chunkText };
