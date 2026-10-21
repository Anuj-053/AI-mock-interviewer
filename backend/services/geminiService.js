const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

let genAI;

function getClient() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

// @desc    Takes an array of text chunks and asks Gemini to convert them into mathematical vectors
const generateEmbeddings = async (textChunks) => {
    try {
        const client = getClient();
        // Google's embedding model outputs 768 dimensions
        const model = client.getGenerativeModel({ model: "gemini-embedding-001" });
        
        const embeddings = [];
        // Process each chunk to get its embedding vector
        for (const chunk of textChunks) {
            const result = await model.embedContent(chunk);
            embeddings.push(result.embedding.values);
        }
        return embeddings;
    } catch (error) {
        console.error("Gemini embedding error:", error);
        throw new Error("Failed to generate embeddings");
    }
};

// @desc    Takes the retrieved resume chunks and asks Gemini to generate exactly 10 interview questions
const generateQuestions = async (context) => {
    try {
        const client = getClient();
        const model = client.getGenerativeModel({ 
            model: "gemini-flash-latest", // Fast and free tier available
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are an expert technical interviewer. I will provide you with snippets from a candidate's resume. 
Your task is to generate exactly 10 DISTINCT Multiple Choice Questions (MCQs) based ONLY on the provided resume context.

CRITICAL INSTRUCTIONS:
1. DO NOT ask generic questions about the resume itself (e.g., "What was the candidate's role?").
2. Extract the SPECIFIC skills (e.g., C++, React) and project technologies (e.g., WebSockets, Node.js) mentioned in the context.
3. Ask deep, topic-related technical questions about those specific skills and technologies. (e.g., If they mention WebSockets, ask a technical question about how WebSockets handle connections. If they mention C++, ask about pointers or memory management).

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "question": "The question text...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctOption": 1,
      "explanation": "A short 1-2 sentence explanation of WHY this is the correct answer."
    }
  ]
}
Note: correctOption should be an integer between 0 and 3 representing the index of the correct option in the options array.

Resume Context:
${context}`;
        
        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());
        return parsed.questions || [];
    } catch (error) {
        console.error("Gemini questions error:", error);
        throw new Error("Failed to generate interview questions");
    }
};

module.exports = {
    generateEmbeddings,
    generateQuestions,
};
