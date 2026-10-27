const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

let index;

function getIndex() {
    if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is not set");
    }

    if (!index) {
        // 1. Initialize the Pinecone client
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        // We specify the name of the index created in the Pinecone dashboard
        // Note: For Gemini text-embedding-004 / gemini-embedding-001, create the Pinecone index with 768 dimensions and cosine metric!
        const indexName = process.env.PINECONE_INDEX_NAME || 'resume-index';
        index = pinecone.Index(indexName);
    }

    return index;
}

// @desc    Stores text chunks and their matching mathematical embeddings into Pinecone
// @param   {string} userId - The ID of the user uploading the resume
// @param   {Array} chunks - The raw text strings (e.g. ["I know React"])
// @param   {Array} embeddings - The mathematical vectors from OpenAI (e.g. [[0.1, 0.2...]])
const storeEmbeddingsInPinecone = async (userId, chunks, embeddings) => {
    try {
        const activeIndex = getIndex();

        // 2. Prepare the data format that Pinecone expects
        const records = chunks.map((chunk, i) => ({
            // Every vector needs a unique ID. We combine the userId and the chunk index.
            id: `${userId}-chunk-${i}`,
            // The actual mathematical array
            values: embeddings[i],
            // "Metadata" is where we store the actual readable text so we can retrieve it later!
            metadata: {
                userId: userId, // We tag it with the user ID so we only search THIS user's resume later
                text: chunk
            }
        }));

        // 3. Insert (upsert) the data into the Pinecone database
        // We use a specific "namespace" (like a folder) for the user to keep data organized
        await activeIndex.namespace(userId).upsert({ records });
        
        console.log(`Successfully saved ${records.length} chunks to Pinecone for user ${userId}`);
    } catch (error) {
        console.error("Error storing embeddings in Pinecone:", error);
        throw new Error("Failed to store data in vector database");
    }
};

// @desc    Searches Pinecone for the most relevant resume chunks based on a mathematical query vector
// @param   {string} userId - The ID of the user whose resume we are searching
// @param   {Array} queryVector - The mathematical vector representing our search question
// @returns {string} A combined string of the top matching resume chunks
const retrieveRelevantChunks = async (userId, queryVector) => {
    try {
        const activeIndex = getIndex();

        // 1. Query the Pinecone index inside the specific user's namespace
        const queryResponse = await activeIndex.namespace(userId).query({
            vector: queryVector,
            topK: 5, // We want the top 5 most relevant chunks
            includeMetadata: true // We need this to get the actual readable text back!
        });

        // 2. Extract the readable text from the results
        // queryResponse.matches contains the top 5 closest vectors
        const relevantTextChunks = queryResponse.matches.map(match => match.metadata.text);

        // 3. Combine them all into one giant string separated by newlines
        return relevantTextChunks.join('\n\n');
    } catch (error) {
        console.error("Error retrieving chunks from Pinecone:", error);
        throw new Error("Failed to retrieve context from vector database");
    }
};

module.exports = {
    storeEmbeddingsInPinecone,
    retrieveRelevantChunks,
};
