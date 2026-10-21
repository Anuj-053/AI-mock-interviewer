const User = require('../models/User');

// @desc    Upload a resume PDF
// @route   POST /api/resume/upload
const uploadResume = async (req, res) => {
    try {
        // 1. Check if a file was actually uploaded by multer
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded. Please upload a PDF.' });
        }

        // 2. Find the logged-in user in the database
        const user = await User.findById(req.user._id);

        // 3. Update the user's resumeFilename with the newly saved file's name
        user.resumeFilename = req.file.filename;
        await user.save();

        // 4. Send success response back to the frontend
        res.json({
            message: 'Resume uploaded successfully',
            filename: req.file.filename
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadResume
};
