// =============================================================
// services/embeddingService.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Converts text (a resume chunk, or a search query) into an
// "embedding" - a list of numbers that represents the MEANING
// of that text, using Google's Gemini embedding model.
//
// WHY WE NEED IT:
// Computers can't compare "meaning" directly. But if we turn
// text into vectors (arrays of numbers), we CAN mathematically
// compare how similar two pieces of text are (this is what
// ChromaDB does internally using cosine similarity).
//
// THIS IS STEP 3 OF THE RAG PIPELINE (and also used at query time):
// Upload PDF -> Extract Text -> Chunk Text -> [EMBED] -> Store -> Retrieve -> LLM
// =============================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client using our API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We use Gemini's dedicated embedding model, NOT the chat model.
// The installed @google/generative-ai SDK in this project supports the
// `embedding-001` model for embedContent().
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// text: a single string (either a resume chunk or a user query)
// Returns: an array of numbers, e.g. [0.021, -0.113, 0.44, ...]
async function generateEmbedding(text) {
  // embedContent() sends the text to Google's servers and gets back
  // a vector representation of its meaning.
  const result = await embeddingModel.embedContent(text);

  // result.embedding.values is the actual array of numbers we want
  return result.embedding.values;
}

// Helper to embed MANY chunks at once (used right after chunking a resume).
// chunks: an array of text strings
// Returns: an array of embedding vectors, in the same order as the chunks
async function generateEmbeddingsForChunks(chunks) {
  const embeddings = [];

  // We loop one at a time (instead of all in parallel) to avoid
  // hitting Gemini's free-tier rate limits too quickly.
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    embeddings.push(embedding);
  }

  return embeddings;
}

module.exports = { generateEmbedding, generateEmbeddingsForChunks };
