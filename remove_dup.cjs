const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Find the first block of {appState === 'cover-letter' && (
let firstCoverLetterStart = content.indexOf("{appState === 'cover-letter' && (");
if (firstCoverLetterStart !== -1) {
    let aiInfoCoverLetter = content.indexOf("{appState === 'ai-info-cover-letter' && (", firstCoverLetterStart);
    if (aiInfoCoverLetter !== -1) {
        // Find the boundary between them
        let beforeAiInfo = content.lastIndexOf(")}", aiInfoCoverLetter) + 3;
        
        let blockToRemove = content.substring(firstCoverLetterStart, beforeAiInfo);
        
        // Let's just remove the block
        content = content.substring(0, firstCoverLetterStart) + content.substring(beforeAiInfo);
        fs.writeFileSync('src/App.tsx', content);
        console.log("Removed first duplicate block.");
    }
}
