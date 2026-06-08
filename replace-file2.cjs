const fs = require('fs');
let appStr = fs.readFileSync('src/App.tsx', 'utf8');

// remove background glow
appStr = appStr.replace(/<div className="absolute top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 w-\[800px\] h-\[600px\] bg-indigo-500\/10 blur-\[120px\] rounded-full pointer-events-none hidden sm:block"><\/div>/g, '');

// remove indigo gradients in buttons
appStr = appStr.replace(/bg-gradient-to-br from-indigo-500 to-purple-600/g, 'bg-[#C19B38]');
appStr = appStr.replace(/bg-gradient-to-br from-purple-500 to-indigo-600/g, 'bg-[#C19B38]');
appStr = appStr.replace(/bg-indigo-600 hover:bg-indigo-500/g, 'bg-[#C19B38] hover:bg-[#a5842f]');

// general indigo text replacement
appStr = appStr.replace(/text-indigo-400/g, 'text-[#C19B38]');
appStr = appStr.replace(/bg-indigo-500\/20/g, 'bg-[#C19B38]/20');
appStr = appStr.replace(/bg-indigo-500\/10/g, 'bg-[#C19B38]/10');
appStr = appStr.replace(/group-hover:bg-indigo-500/g, 'group-hover:bg-[#C19B38]');
appStr = appStr.replace(/hover:border-indigo-500\/50/g, 'hover:border-[#C19B38]/50');

// purple variants
appStr = appStr.replace(/text-purple-400/g, 'text-[#C19B38]');
appStr = appStr.replace(/bg-purple-500\/10/g, 'bg-[#C19B38]/10');
appStr = appStr.replace(/group-hover:bg-purple-500/g, 'group-hover:bg-[#C19B38]');
appStr = appStr.replace(/hover:border-purple-500\/50/g, 'hover:border-[#C19B38]/50');

// slate 800 cards 
appStr = appStr.replace(/bg-slate-800\/40/g, 'bg-[#141f38]/60');
appStr = appStr.replace(/hover:bg-slate-800\/80/g, 'hover:bg-[#141f38]');

fs.writeFileSync('src/App.tsx', appStr);
