const fs = require('fs');

let code = fs.readFileSync('src/components/ResumePreview.tsx', 'utf-8');

// I will just use string manipulation, searching for the top level {} blocks 
// in each render function.

// Find where each section starts and ends.
// But wait, there is a better way!
// I can do this using the AST with `npx ts-node` or `npx jscodeshift`.
