const fs = require("fs");
const pdfParse = require("pdf-parse");

// @desc    Reads a PDF file from the disk and extracts all the text inside it
// @param   {string} filePath - The exact location of the PDF file (e.g. 'uploads/resume.pdf')
// @returns {string} The raw text extracted from the PDF
const extractTextFromPDF = async (filePath) => {
    try {
        // 1. Read the physical file from the hard drive into memory (as a data buffer)
        const dataBuffer = fs.readFileSync(filePath);

        // 2. Pass the buffer into pdf-parse to extract the text
        const data = await pdfParse(dataBuffer);

        // 3. Return only the extracted text string
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
};

module.exports = {
    extractTextFromPDF,
};
