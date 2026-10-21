// @desc    Splits a large string of text into smaller, digestible "chunks"
// @param   {string} text - The massive wall of text extracted from the PDF
// @param   {number} maxChunkSize - The maximum number of characters per chunk (default 500)
// @returns {Array} An array of smaller text strings
const chunkText = (text, maxChunkSize = 500) => {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const chunks = [];
    let currentChunk = '';

    const sentences = cleanedText.split('. ');

    for (const sentence of sentences) {
        if (!sentence.trim()) continue;

        if ((currentChunk + sentence).length <= maxChunkSize) {
            currentChunk += sentence + '. ';
        } else {
            // Only push if there's actually text in the current chunk
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
            }
            // Start the new chunk
            currentChunk = sentence + '. ';
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    // Double-check to remove any accidental empty chunks before returning
    return chunks.filter(chunk => chunk.trim().length > 0);
};

module.exports = {
    chunkText,
};
