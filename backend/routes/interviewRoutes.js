const express = require("express");
const {
	startInterview,
	evaluateCandidateAnswer,
	finishInterview,
	getInterview,
} = require("../controllers/interviewController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Route: GET /api/interview/:id
// Fetches the interview questions
router.get('/:id', protect, getInterview);

// Route: POST /api/interview/start
// Runs the full RAG pipeline and returns 10 questions
router.post('/start', protect, startInterview);

// Route: POST /api/interview/:id/evaluate
// Evaluates a single answer during the interview
router.post('/:id/evaluate', protect, evaluateCandidateAnswer);

// Route: POST /api/interview/:id/finish
// Finishes the interview and calculates final score
router.post('/:id/finish', protect, finishInterview);

module.exports = router;
