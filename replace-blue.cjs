const fs = require('fs');
let appStr = fs.readFileSync('src/App.tsx', 'utf8');

// The user wants the specific blue background. We update the main views.
appStr = appStr.replace(/bg-\[#0c1427\]/g, 'bg-[#0b132b]');

// Search for bg-slate-900 and replace it with bg-[#0b132b] as well
appStr = appStr.replace(/bg-slate-900/g, 'bg-[#0b132b]');

// Search for slate-950 and replace with darker variant
appStr = appStr.replace(/bg-slate-950/g, 'bg-[#080d1e]');

fs.writeFileSync('src/App.tsx', appStr);
