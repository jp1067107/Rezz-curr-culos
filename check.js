const fs = require('fs');

let code = fs.readFileSync('src/components/ResumePreview.tsx', 'utf-8');

// I'll try to find sequences of sections in the code and replace them.
// A typical sequence is:
/*
      {experience.length > 0 && (
        ...
      )}

      {education.length > 0 && (
        ...
      )}
*/

function extractBlocks(code) {
  // Too complex to parse with RegExp precisely without breaking braces.
}
