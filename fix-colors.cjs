const fs = require('fs');

function fixColors(filename) {
  let content = fs.readFileSync(filename, 'utf8');

  // Replace purple specific colors
  content = content.replace(/hover:border-purple-500\/30/g, 'hover:border-[#C19B38]/50');
  content = content.replace(/bg-purple-500\/20/g, 'bg-[#C19B38]/20');
  content = content.replace(/text-purple-300/g, 'text-[#C19B38]');
  content = content.replace(/border-purple-500\/30/g, 'border-[#C19B38]/30');
  content = content.replace(/bg-purple-600/g, 'bg-[#C19B38]');
  content = content.replace(/shadow-purple-600\/30/g, 'shadow-[#C19B38]/30');
  content = content.replace(/hover:bg-purple-500/g, 'hover:bg-[#a5842f]');
  
  content = content.replace(/from-indigo-500\/10/g, 'from-[#141f38]/60');
  content = content.replace(/to-purple-500\/10/g, 'to-transparent');
  content = content.replace(/border-indigo-500\/20/g, 'border-[#C19B38]/20');
  
  content = content.replace(/shadow-purple-500\/20/g, 'shadow-[#C19B38]/20');
  content = content.replace(/from-emerald-400 via-indigo-500 to-purple-500/g, 'from-emerald-400 via-[#C19B38] to-[#a5842f]');
  
  // Replace indigo colors
  content = content.replace(/focus:ring-indigo-500\/50/g, 'focus:ring-[#C19B38]/50');
  content = content.replace(/focus:ring-indigo-500/g, 'focus:ring-[#C19B38]');
  content = content.replace(/border-indigo-500\/30/g, 'border-[#C19B38]/30');
  content = content.replace(/hover:border-indigo-400/g, 'hover:border-[#C19B38]');
  content = content.replace(/group-hover:text-indigo-400/g, 'group-hover:text-[#C19B38]');
  content = content.replace(/border-indigo-400\/30/g, 'border-[#C19B38]/30');
  content = content.replace(/text-indigo-200/g, 'text-[#e5c76c]');
  
  content = content.replace(/bg-indigo-500\/20/g, 'bg-[#C19B38]/20');
  content = content.replace(/bg-indigo-500\/10/g, 'bg-[#C19B38]/10');
  content = content.replace(/bg-indigo-500/g, 'bg-[#C19B38]');
  content = content.replace(/text-indigo-400/g, 'text-[#C19B38]');
  
  // Indigo App.tsx specific
  content = content.replace(/hover:bg-indigo-600/g, 'hover:bg-[#a5842f]');
  content = content.replace(/shadow-indigo-500\/20/g, 'shadow-[#C19B38]/20');
  content = content.replace(/hover:border-indigo-500\/30/g, 'hover:border-[#C19B38]/30');
  content = content.replace(/text-indigo-300/g, 'text-[#e5c76c]');
  content = content.replace(/border-indigo-500/g, 'border-[#C19B38]');
  content = content.replace(/shadow-indigo-500\/10/g, 'shadow-[#C19B38]/10');
  content = content.replace(/shadow-indigo-600\/20/g, 'shadow-[#C19B38]/20');
  
  content = content.replace(/hover:bg-indigo-400/g, 'hover:bg-[#a5842f]');
  content = content.replace(/text-indigo-500/g, 'text-[#C19B38]');
  content = content.replace(/hover:text-indigo-500/g, 'hover:text-[#C19B38]');
  
  fs.writeFileSync(filename, content);
}

fixColors('src/App.tsx');
fixColors('src/components/ResumeForm.tsx');
fixColors('src/components/CoverLetterGenerator.tsx');
fixColors('src/components/ImageUpload.tsx');
