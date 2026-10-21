const mongoose = require("mongoose");

const savedQuestionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctOption: {
        type: Number,
        required: true
    },
    explanation: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("SavedQuestion", savedQuestionSchema);
