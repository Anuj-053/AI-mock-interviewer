const multer = require("multer");
const path = require("path");

// 1. Configure where and how to save the uploaded files
const storage = multer.diskStorage({
    // Tell multer to save files in the 'uploads' directory
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    // Tell multer what to name the file
    // We combine the user's ID, the current timestamp, and the original extension (.pdf)
    filename(req, file, cb) {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. Filter to make sure we ONLY accept PDF files
const checkFileType = (file, cb) => {
    if (file.mimetype === 'application/pdf') {
        return cb(null, true); // Accept the file
    } else {
        cb('Error: You can only upload PDF files!'); // Reject the file
    }
};

// 3. Initialize Multer with our storage rules and file filter
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
