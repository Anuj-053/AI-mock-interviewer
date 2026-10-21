const express = require("express");
const {
    saveQuestion,
    getSavedQuestions,
    deleteSavedQuestion
} = require("../controllers/savedQuestionController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post('/', protect, saveQuestion);
router.get('/', protect, getSavedQuestions);
router.delete('/:id', protect, deleteSavedQuestion);

module.exports = router;
