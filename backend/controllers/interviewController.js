const path = require("path");
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

        // 1. Extract Text
        console.log("Extracting text...");
        const text = await extractTextFromPDF(filePath);

        // 2. Chunk Text
        console.log("Chunking text...");
        const chunks = chunkText(text);

        // 3. Generate Embeddings
        console.log("Generating embeddings...");
        const embeddings = await generateEmbeddings(chunks);

        // 4. Store in Pinecone
        console.log("Storing in Pinecone...");
        await storeEmbeddingsInPinecone(user._id.toString(), chunks, embeddings);

        // 5. Retrieve Relevant Chunks (we query for "core technical skills and professional experience")
        console.log("Retrieving relevant context...");
        const queryVector = (
            await generateEmbeddings([
                "core technical skills and professional experience",
            ])
        )[0];
        const context = await retrieveRelevantChunks(user._id.toString(), queryVector);

        // 6. Generate Questions
        console.log("Generating questions...");
        const questions = await generateQuestions(context);

        // 7. Save to MongoDB
        const interview = await Interview.create({
            user: user._id,
            questions: questions
        });

        res.status(201).json(interview);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to start interview." });
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
