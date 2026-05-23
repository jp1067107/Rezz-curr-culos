const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

let regex = /{appState === 'cover-letter' && \([\s\S]*?(?={appState ===)/g;
let match;
let lastIndex = 0;
let blocks = [];
while ((match = regex.exec(content)) !== null) {
  blocks.push({
    start: match.index,
    length: match[0].length,
    end: match.index + match[0].length
  });
}
console.log(blocks);
