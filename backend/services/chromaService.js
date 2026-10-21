// =============================================================
// services/chromaService.js
// -------------------------------------------------------------
// WHAT THIS FILE DOES:
// Handles all communication with ChromaDB - our vector database.
// It can (1) store resume chunk embeddings, and (2) retrieve the
// most relevant chunks for a given query.
//
// WHY WE NEED IT:
// ChromaDB is where the "search by meaning" magic happens. Instead
// of keyword search, it finds chunks whose embeddings are
// mathematically CLOSEST to the query's embedding.
//
// THIS IS STEP 4 (store) AND STEP 5 (retrieve) OF THE RAG PIPELINE:
// ... -> Embed -> [STORE IN CHROMA] -> [RETRIEVE TOP-K] -> LLM
// =============================================================

const { ChromaClient } = require("chromadb");
const { generateEmbedding } = require("./embeddingService");

// Connect to our local ChromaDB server (started separately, see README)
const client = new ChromaClient({ path: process.env.CHROMA_URL });

// Every resume gets its own Chroma "collection" (like a table),
// named using its unique resumeId. This keeps different users'
// resumes completely separate from each other automatically.
async function getOrCreateCollection(resumeId) {
  const collection = await client.getOrCreateCollection({
    name: `resume_${resumeId}`,
  });
  return collection;
}

// -------------------------------------------------------------
// Store resume chunks + their embeddings in ChromaDB
// -------------------------------------------------------------
// resumeId: unique id for this resume (links Mongo <-> Chroma)
// chunks: array of text chunks
// embeddings: array of embedding vectors (same order as chunks)
async function storeChunks(resumeId, chunks, embeddings) {
  const collection = await getOrCreateCollection(resumeId);

  // ChromaDB requires a unique string ID for every entry we add.
  // We simply use the chunk's position number as its id ("0", "1", "2"...)
  const ids = chunks.map((_, index) => `${resumeId}_chunk_${index}`);

  // collection.add() stores everything together:
  // - ids: unique identifiers
  // - embeddings: the vector for each chunk (used for similarity search)
  // - documents: the original text (so we can retrieve the actual words later)
  await collection.add({
    ids,
    embeddings,
    documents: chunks,
  });

  console.log(`✅ Stored ${chunks.length} chunks in ChromaDB for resume ${resumeId}`);
}

// -------------------------------------------------------------
// Retrieve the top-K most relevant chunks for a query
// -------------------------------------------------------------
// resumeId: which resume's collection to search in
// query: the text we want to find relevant chunks for
//        (e.g. "generate interview questions about this candidate's skills")
// topK: how many chunks to return (default 5)
async function retrieveRelevantChunks(resumeId, query, topK = 5) {
  const collection = await getOrCreateCollection(resumeId);

  // First, turn the query into an embedding using the SAME
  // embedding model we used for the resume chunks. This is essential -
  // you can only compare vectors that came from the same model.
  const queryEmbedding = await generateEmbedding(query);

  // collection.query() asks ChromaDB: "which stored embeddings are
  // mathematically closest to this query embedding?"
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  // results.documents is a nested array (one array per query we sent).
  // Since we only sent ONE query, we take the first inner array.
  const relevantChunks = results.documents[0] || [];

  return relevantChunks;
}

module.exports = { storeChunks, retrieveRelevantChunks };
