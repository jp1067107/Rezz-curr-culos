const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\{appState === 'my-resumes' && \([\s\S]*?\n      \)\}\n/;
const match = content.match(regex);
if (match) {
  let myCoverLettersStr = match[0]
    .replace(/'my-resumes'/g, "'my-cover-letters'")
    .replace(/"my-resumes"/g, '"my-cover-letters"')
    .replace(/Meus Currículos/g, 'Minhas Cartas de Apresentação')
    .replace(/<FolderOpen/g, '<Wand2')
    .replace(/Criar Novo Currículo/g, 'Criar Nova Carta')
    .replace(/Editar Currículo Antigo/g, 'Importar Dados para Carta')
    .replace(/Restaure um currículo/g, 'Restaure uma carta')
    .replace(/currículos/g, 'cartas')
    .replace(/currículo/g, 'carta')
    .replace(/purchasedResumes/g, 'purchasedCoverLetters')
    .replace(/resume\.id/g, 'letter.id')
    .replace(/\(resume =>/g, '(letter =>')
    .replace(/resume\./g, 'letter.')
    .replace(/currentResumeId/g, 'currentCoverLetterId')
    .replace(/setCurrentResumeId/g, 'setCurrentCoverLetterId')
    .replace(/setResumesList/g, 'setCoverLettersList')
    .replace(/setLocalPurchasedResumes/g, 'setLocalPurchasedCoverLetters')
    .replace(/saveResume/g, 'saveCoverLetter')
    .replace(/deleteResume/g, 'deleteCoverLetter')
    .replace(/handleLoadResume\(letter\)/g, "handleLoadCoverLetter(letter)");

  // We place it right after my-resumes block.
  content = content.replace(match[0], match[0] + '\n' + myCoverLettersStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success");
} else {
  console.log("Not found block 1");
}

let handleIndex = content.indexOf(`const handleLoadResume = (resume: ResumeDoc) => {`);
if (handleIndex !== -1) {
  let endHandle = content.indexOf('};', handleIndex) + 2;
  let handleCode = content.substring(handleIndex, endHandle);
  let newHandle = handleCode
    .replace(/handleLoadResume/g, 'handleLoadCoverLetter')
    .replace(/resume: ResumeDoc/g, 'letter: ResumeDoc')
    .replace(/resume\./g, 'letter.')
    .replace(/currentResumeId/g, 'currentCoverLetterId')
    .replace(/setCurrentResumeId/g, 'setCurrentCoverLetterId')
    .replace(/'editor'/g, "'cover-letter'");
  
  content = content.substring(0, endHandle) + '\n\n  ' + newHandle + content.substring(endHandle);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success handle");
} else {
  console.log("Not found block 2");
}
