const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Interview = require("../models/Interview");
const { extractTextFromPDF } = require("../utils/pdfParser");
const { chunkText } = require("../utils/textChunker");
const {
    generateEmbeddings,
    generateQuestions,
} = require("../services/geminiService");
const {
    storeEmbeddingsInPinecone,
    retrieveRelevantChunks,
} = require("../services/pineconeService");

// @desc    Start an interview: Parse PDF -> Chunk -> Embed -> Store -> Retrieve -> Generate Qs
// @route   POST /api/interview/start
const startInterview = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.resumeFilename) {
            return res.status(400).json({ message: "No resume found. Please upload one first." });
        }

        const filePath = path.join(process.cwd(), 'uploads', user.resumeFilename);
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ 
                message: "Uploaded resume file is no longer on the server. Please re-upload your resume PDF." 
            });
        }

        // 1. Extract Text
        console.log("Extracting text from PDF...");
        const text = await extractTextFromPDF(filePath);

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ 
                message: "No readable text found in the PDF. Please upload a standard text PDF resume." 
            });
        }

        // 2. Chunk Text
        console.log("Chunking text...");
        const chunks = chunkText(text);

        // 3. Attempt RAG (Embeddings + Pinecone vector retrieval)
        let context = "";
        try {
            console.log("Generating embeddings and searching Pinecone...");
            const embeddings = await generateEmbeddings(chunks);
            await storeEmbeddingsInPinecone(user._id.toString(), chunks, embeddings);
            
            const queryVector = (
                await generateEmbeddings([
                    "core technical skills and professional experience",
                ])
            )[0];
            context = await retrieveRelevantChunks(user._id.toString(), queryVector);
            console.log("Pinecone retrieval successful!");
        } catch (ragError) {
            console.warn("Vector search bypassed (falling back to direct resume context):", ragError.message);
            // Fallback: take the most relevant chunks directly from the resume
            context = chunks.slice(0, 10).join("\n\n");
        }

        // If context is still empty or minimal, use the extracted resume text directly
        if (!context || context.trim().length < 50) {
            context = text.slice(0, 4000);
        }

        // 4. Generate Questions with Gemini
        console.log("Generating 10 MCQs with Gemini...");
        const questions = await generateQuestions(context);

        if (!questions || questions.length === 0) {
            throw new Error("AI could not generate questions from the resume. Please try again.");
        }

        // 5. Save to MongoDB
        const interview = await Interview.create({
            user: user._id,
            questions: questions
        });

        console.log(`Interview created successfully with ${questions.length} questions.`);
        res.status(201).json(interview);
    } catch (error) {
        console.error("Start interview error:", error);
        res.status(500).json({ message: error.message || "Failed to start interview." });
    }
};

// @desc    Evaluate a single answer (MCQ)
// @route   POST /api/interview/:id/evaluate
const evaluateCandidateAnswer = async (req, res) => {
    try {
        const { questionIndex, selectedOption } = req.body;
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        const currentQuestion = interview.questions[questionIndex];
        const isCorrect = selectedOption === currentQuestion.correctOption;

        // 2. Save result to MongoDB
        interview.qaList.push({
            question: currentQuestion.question,
            selectedOption,
            isCorrect
        });

        await interview.save();

        res.json({ isCorrect, correctOption: currentQuestion.correctOption });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to evaluate answer." });
    }
};

// @desc    Get interview data
// @route   GET /api/interview/:id
const getInterview = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) return res.status(404).json({ message: "Interview not found" });
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: "Failed to get interview" });
    }
};

// @desc    Finish interview and calculate total score
// @route   POST /api/interview/:id/finish
const finishInterview = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        // Calculate average score out of 100
        const correctAnswers = interview.qaList.filter(qa => qa.isCorrect).length;
        const totalQuestions = interview.questions.length || 10;
        
        interview.overallScore = (correctAnswers / totalQuestions) * 100;
        interview.isCompleted = true;
        
        await interview.save();

        res.json({ overallScore: interview.overallScore });
    } catch (error) {
        res.status(500).json({ message: "Failed to finish interview." });
    }
};

module.exports = {
    startInterview,
    evaluateCandidateAnswer,
    finishInterview,
    getInterview,
};
