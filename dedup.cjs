const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// find all blocks with {appState === 'cover-letter' && (
let regex = /{appState === 'cover-letter' && \(/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found cover-letter at ${match.index}`);
}
