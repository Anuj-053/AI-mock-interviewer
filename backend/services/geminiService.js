const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

let genAI;

function getClient() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

// Dynamically discover all active models from Google API that support generateContent
let cachedActiveModel = null;

async function getAvailableModel(apiKey) {
    if (process.env.GEMINI_MODEL) {
        return process.env.GEMINI_MODEL;
    }
    if (cachedActiveModel) {
        return cachedActiveModel;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            
            // Prioritize flash models that support generateContent
            const activeFlash = models.find(m => 
                m.supportedGenerationMethods?.includes("generateContent") &&
                m.name.toLowerCase().includes("flash")
            );
            if (activeFlash) {
                cachedActiveModel = activeFlash.name.replace(/^models\//, "");
                console.log(`[GeminiService] Discovered active flash model: ${cachedActiveModel}`);
                return cachedActiveModel;
            }

            // Fallback to any model that supports generateContent
            const anyActive = models.find(m => m.supportedGenerationMethods?.includes("generateContent"));
            if (anyActive) {
                cachedActiveModel = anyActive.name.replace(/^models\//, "");
                console.log(`[GeminiService] Discovered active generative model: ${cachedActiveModel}`);
                return cachedActiveModel;
            }
        }
    } catch (e) {
        console.warn("[GeminiService] Dynamic model discovery failed:", e.message);
    }

    // Default to the modern 2.5 flash model
    return "gemini-2.5-flash";
}

// @desc    Takes an array of text chunks and generates embeddings
const generateEmbeddings = async (textChunks) => {
    const client = getClient();
    const candidateEmbeddingModels = [
        process.env.GEMINI_EMBEDDING_MODEL,
        "text-embedding-004",
        "gemini-embedding-001",
    ].filter(Boolean);

    for (const modelName of candidateEmbeddingModels) {
        try {
            const model = client.getGenerativeModel({ model: modelName });
            const embeddings = [];
            for (const chunk of textChunks) {
                const result = await model.embedContent(chunk);
                embeddings.push(result.embedding.values);
            }
            return embeddings;
        } catch (err) {
            console.warn(`[GeminiService] Embedding with ${modelName} failed: ${err.message}. Trying next model...`);
        }
    }

    throw new Error("All embedding models failed. Vector search will be gracefully bypassed.");
};

// Deterministic fallback MCQ bank in case all LLM endpoints are completely unavailable or quota-exhausted
function getFallbackQuestions(context) {
    const skills = [
        { name: "JavaScript / TypeScript", q: "Which of the following is true regarding JavaScript's event loop and microtask queue?", opts: ["Promises are handled in the microtask queue with higher priority than setTimeout", "setTimeout executes before Promise.then()", "The microtask queue only executes when the call stack has 5+ frames", "Microtasks run in a separate OS thread"], correct: 0, exp: "Microtasks (such as resolved Promise callbacks and queueMicrotask) run immediately after the current macrotask completes and before the next macrotask." },
        { name: "React", q: "In React 18+, what is the primary purpose of the useMemo hook?", opts: ["To trigger component re-renders on every prop update", "To memoize expensive calculation results between renders", "To directly mutate the DOM tree", "To handle asynchronous HTTP requests during render"], correct: 1, exp: "useMemo caches the result of a calculation between re-renders until one of its dependencies changes." },
        { name: "Node.js", q: "How does Node.js achieve non-blocking asynchronous I/O despite being single-threaded in the main JS thread?", opts: ["By running multiple V8 engines in parallel", "Via libuv and its background worker thread pool", "By executing synchronous blocking calls on the GPU", "By compiling JavaScript directly to machine code on startup"], correct: 1, exp: "Node.js relies on libuv which provides the event loop and a thread pool to offload intensive I/O operations." },
        { name: "Databases / SQL", q: "What is the primary difference between an INNER JOIN and a LEFT JOIN in relational databases?", opts: ["INNER JOIN returns only rows with matches in both tables; LEFT JOIN returns all rows from the left table", "LEFT JOIN is always faster than INNER JOIN", "INNER JOIN creates a new table; LEFT JOIN only views existing data", "LEFT JOIN automatically creates foreign keys"], correct: 0, exp: "INNER JOIN selects records that have matching values in both tables, while LEFT JOIN returns all records from the left table and matched records from the right." },
        { name: "REST APIs & HTTP", q: "Which HTTP status code is most appropriate when a resource is successfully created via a POST request?", opts: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"], correct: 1, exp: "201 Created indicates that the request has succeeded and has led to the creation of a new resource." },
        { name: "Data Structures", q: "What is the average time complexity of looking up a value by key in a standard Hash Table?", opts: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], correct: 0, exp: "Hash tables offer average O(1) constant time complexity for insertions and lookups assuming a good hash function." },
        { name: "System Design", q: "What does horizontal scaling (scaling out) refer to in distributed systems?", opts: ["Adding more CPU or RAM to an existing single machine", "Adding more servers/nodes to distribute the load across a cluster", "Compressing database indexes to fit in memory", "Migrating from SQL to NoSQL"], correct: 1, exp: "Horizontal scaling involves adding more machines to your pool of resources rather than upgrading the hardware of a single machine." },
        { name: "Git & Version Control", q: "What is the purpose of `git rebase` compared to `git merge`?", opts: ["git rebase rewrites project history by moving commits to a new base tip, creating a linear history", "git rebase permanently deletes uncommitted changes", "git rebase can only be used on remote repositories", "git merge always drops commit messages"], correct: 0, exp: "git rebase reapplies commits on top of another base tip to maintain a clean, linear commit history." },
        { name: "Web Security", q: "What security vulnerability is mitigated by using parameterized queries / prepared statements?", opts: ["Cross-Site Scripting (XSS)", "SQL Injection (SQLi)", "Cross-Site Request Forgery (CSRF)", "Distributed Denial of Service (DDoS)"], correct: 1, exp: "Prepared statements ensure the database engine treats user input as data rather than executable SQL code, preventing SQL injection." },
        { name: "Containerization & Cloud", q: "In Docker, what is the fundamental difference between an Image and a Container?", opts: ["An image is a running instance; a container is the static blueprint", "An image is a static read-only template; a container is a running, stateful instance of that image", "Images require Kubernetes; containers do not", "There is no difference between them"], correct: 1, exp: "A Docker image is an immutable template containing instructions, while a container is a live, executable instance of an image." }
    ];

    return skills.map((item, idx) => ({
        question: item.q,
        options: item.opts,
        correctOption: item.correct,
        explanation: item.exp
    }));
}

// @desc    Takes the retrieved resume chunks and asks Gemini to generate exactly 10 interview questions
const generateQuestions = async (context) => {
    const client = getClient();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Discover the active model dynamically or use modern fallbacks
    const candidateModels = [];
    if (process.env.GEMINI_MODEL) {
        candidateModels.push(process.env.GEMINI_MODEL);
    }
    
    const discovered = await getAvailableModel(apiKey);
    if (discovered && !candidateModels.includes(discovered)) {
        candidateModels.push(discovered);
    }

    // Modern candidate fallbacks in order of recommendation
    const standardCandidates = [
        "gemini-2.5-flash",
        "gemini-3.8-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
    ];
    for (const model of standardCandidates) {
        if (!candidateModels.includes(model)) {
            candidateModels.push(model);
        }
    }

    const prompt = `You are a Principal Software Engineer conducting a technical interview.
Based on the candidate's resume context below, generate exactly 10 high-quality technical Multiple Choice Questions (MCQs).

INSTRUCTIONS:
1. Focus on the actual technologies, frameworks, and programming concepts found in the resume.
2. Provide 4 plausible options for each question.
3. Specify the 0-indexed correct option (0, 1, 2, or 3).
4. Provide a 1-sentence technical explanation.

Return ONLY a JSON object:
{
  "questions": [
    {
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "Explanation..."
    }
  ]
}

Resume Context:
${context}`;

    for (const modelName of candidateModels) {
        try {
            console.log(`[GeminiService] Attempting question generation with model: ${modelName}`);
            const model = client.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent(prompt);
            let rawText = result.response.text().trim();
            rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/g, "").trim();

            let questions = [];
            try {
                const parsed = JSON.parse(rawText);
                questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
            } catch (jsonErr) {
                const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
                }
            }

            questions = questions.filter(q => q && q.question && Array.isArray(q.options) && q.options.length >= 2);

            if (questions.length >= 5) {
                console.log(`[GeminiService] Successfully generated ${questions.length} questions using ${modelName}`);
                return questions;
            }
        } catch (err) {
            console.warn(`[GeminiService] Model ${modelName} failed (${err.message}). Trying next candidate...`);
        }
    }

    // If all online models fail (e.g. rate limit, quota, Google downtime), return the curated technical question bank
    console.warn("[GeminiService] All online AI generation attempts failed. Using fallback technical interview set.");
    return getFallbackQuestions(context);
};

module.exports = {
    generateEmbeddings,
    generateQuestions,
};
