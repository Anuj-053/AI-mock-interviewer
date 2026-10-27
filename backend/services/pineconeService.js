const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

let pineconeClient;

function getPineconeClient() {
    if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is not set in environment variables");
    }
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return pineconeClient;
}

async function getIndex() {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'resume-index';

    if (!index) {
        try {
            const indexList = await pc.listIndexes();
            const names = (indexList.indexes || []).map(idx => idx.name);
            if (!names.includes(indexName)) {
                console.log(`Index "${indexName}" not found in Pinecone. Creating it automatically (dimension 768, cosine, AWS serverless)...`);
                await pc.createIndex({
                    name: indexName,
                    dimension: 768,
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: 'us-east-1'
                        }
                    }
                });
                console.log(`Index "${indexName}" created successfully!`);
            }
        } catch (err) {
            console.warn(`Pinecone auto-check warning:`, err.message);
        }
        index = pc.Index(indexName);
    }

    return index;
}

// @desc    Stores text chunks and their matching mathematical embeddings into Pinecone
// @param   {string} userId - The ID of the user uploading the resume
// @param   {Array} chunks - The raw text strings (e.g. ["I know React"])
// @param   {Array} embeddings - The mathematical vectors from OpenAI (e.g. [[0.1, 0.2...]])
const storeEmbeddingsInPinecone = async (userId, chunks, embeddings) => {
    try {
        const activeIndex = await getIndex();

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
        throw new Error(`Failed to store data in Pinecone: ${error.message}`);
    }
};

// @desc    Searches Pinecone for the most relevant resume chunks based on a mathematical query vector
// @param   {string} userId - The ID of the user whose resume we are searching
// @param   {Array} queryVector - The mathematical vector representing our search question
// @returns {string} A combined string of the top matching resume chunks
const retrieveRelevantChunks = async (userId, queryVector) => {
    try {
        const activeIndex = await getIndex();

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
        throw new Error(`Failed to retrieve context from Pinecone: ${error.message}`);
    }
};

module.exports = {
    storeEmbeddingsInPinecone,
    retrieveRelevantChunks,
};
