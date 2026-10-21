const SavedQuestion = require("../models/SavedQuestion");

// @desc    Save a question for revision
// @route   POST /api/saved-questions
const saveQuestion = async (req, res) => {
    try {
        const { question, options, correctOption, explanation } = req.body;
        
        // Prevent saving the exact same question twice
        const exists = await SavedQuestion.findOne({ user: req.user._id, question });
        if (exists) {
            return res.status(400).json({ message: "Question already saved" });
        }

        const savedQ = await SavedQuestion.create({
            user: req.user._id,
            question,
            options,
            correctOption,
            explanation
        });

        res.status(201).json(savedQ);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to save question" });
    }
};

// @desc    Get all saved questions for user
// @route   GET /api/saved-questions
const getSavedQuestions = async (req, res) => {
    try {
        const questions = await SavedQuestion.find({ user: req.user._id }).sort('-createdAt');
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch saved questions" });
    }
};

// @desc    Remove a saved question
// @route   DELETE /api/saved-questions/:id
const deleteSavedQuestion = async (req, res) => {
    try {
        const question = await SavedQuestion.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        if (question.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await question.deleteOne();
        res.json({ message: "Question removed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove question" });
    }
};

module.exports = {
    saveQuestion,
    getSavedQuestions,
    deleteSavedQuestion
};
