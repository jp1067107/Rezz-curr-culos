const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /{\/\* Criar Novo \(IA\) - Featured \*\/}[\s\S]*?(?={\/\* Editor Manual \*\/})/;
const match = content.match(regex);
if (match) {
  let criarBlock = match[0];
  let criarCartaBlock = criarBlock
     .replace('Criar via Inteligência Artificial', 'Criar Carta via Inteligência Artificial')
     .replace(/'ai-info'/g, "'ai-info-cover-letter'")
     .replace(/{\/\* Criar Novo \(IA\) - Featured \*\/}/, '{/* Criar Carta via IA */}');
     
  content = content.replace(match[0], match[0] + '\n                ' + criarCartaBlock);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success adding to dashboard");
} else {
  console.log("Failed to find Criar Novo (IA) - Featured in dashboard");
}
