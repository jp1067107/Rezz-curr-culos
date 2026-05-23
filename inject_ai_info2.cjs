const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /{appState === 'ai-info' && \([\s\S]*?(?={appState === 'purchased-view')/;
const match = content.match(regex);
if (match) {
  let aiInfoStr = match[0];
  let aiInfoCoverLetterStr = aiInfoStr
     .replace(/'ai-info'/g, "'ai-info-cover-letter'")
     .replace(/Tecnologia Pura no seu Currículo/g, 'Tecnologia Pura na sua Carta')
     .replace(/handleAiImport/g, 'handleAiCoverLetterImport');
     
  content = content.replace(match[0], match[0] + '\n' + aiInfoCoverLetterStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success ai-info-cover-letter");
} else {
  // Let's do exact block split
  let aiInfoIdx = content.indexOf(`{appState === 'ai-info' && (`);
  if (aiInfoIdx !== -1) {
    let nextAppIdx = content.indexOf(`{appState ===`, aiInfoIdx + 50);
    let block = content.substring(aiInfoIdx, nextAppIdx);
    let newBlock = block
       .replace(/'ai-info'/g, "'ai-info-cover-letter'")
       .replace(/Tecnologia Pura no seu Currículo/g, 'Tecnologia Pura na sua Carta')
       .replace(/handleAiImport/g, 'handleAiCoverLetterImport');
    
    content = content.substring(0, aiInfoIdx) + block + newBlock + content.substring(nextAppIdx);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Success exact split");
  } else {
    console.log("Could not find ai-info");
  }
}
