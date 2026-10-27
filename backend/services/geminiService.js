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
        const modelName = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
        const model = client.getGenerativeModel({ model: modelName });
        
        const embeddings = [];
        for (const chunk of textChunks) {
            const result = await model.embedContent(chunk);
            embeddings.push(result.embedding.values);
        }
        return embeddings;
    } catch (error) {
        console.error("Gemini embedding error:", error.message);
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
};

// @desc    Takes the retrieved resume chunks and asks Gemini to generate exactly 10 interview questions
const generateQuestions = async (context) => {
    try {
        const client = getClient();
        const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const model = client.getGenerativeModel({ 
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are an expert technical interviewer. I will provide you with snippets from a candidate's resume. 
Your task is to generate exactly 10 DISTINCT Multiple Choice Questions (MCQs) based on the candidate's technical skills and projects.

CRITICAL INSTRUCTIONS:
1. Extract specific skills (e.g. languages, frameworks, databases, tools) mentioned in the resume.
2. Formulate 10 deep, technical multiple-choice questions testing those specific skills.
3. Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}
Note: correctOption must be an integer index (0, 1, 2, or 3).

Resume Context:
${context}`;
        
        const result = await model.generateContent(prompt);
        let rawText = result.response.text().trim();
        // Strip markdown fences if Gemini added them
        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/g, '').trim();

        let questions = [];
        try {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed)) {
                questions = parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            }
        } catch (jsonErr) {
            console.warn("Direct JSON.parse failed, attempting regex extraction...");
            const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
            }
        }

        // Validate that we have valid question objects
        questions = questions.filter(q => q && q.question && Array.isArray(q.options) && q.options.length >= 2);

        return questions;
    } catch (error) {
        console.error("Gemini questions error:", error.message);
        throw new Error(`Failed to generate interview questions: ${error.message}`);
    }
};

module.exports = {
    generateEmbeddings,
    generateQuestions,
};
