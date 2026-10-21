const express = require('express');
const { uploadResume } = require('../controllers/resumeController');
const protect = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Route: POST /api/resume/upload
// 1. "protect" ensures the user is logged in
// 2. "upload.single('resume')" uses Multer to grab the file named 'resume' and save it
// 3. "uploadResume" is our custom controller that saves the filename to the database
router.post('/upload', protect, upload.single('resume'), uploadResume);

module.exports = router;
