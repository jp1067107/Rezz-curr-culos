const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const handleUploadInternalPdfChange = async[\s\S]*?};\n/;
const match = content.match(regex);
if (match) {
  let newHandlerStr = match[0]
     .replace('handleUploadInternalPdfChange', 'handleUploadCoverLetterPdfChange')
     .replace(/setCurrentResumeId/g, 'setCurrentCoverLetterId')
     .replace(/setAppState\('editor'\)/g, "setAppState('cover-letter')")
     .replace(/setIsUploadingInternalPdf/g, 'setIsUploadingCoverLetterPdf')
     .replace(/internalPdfInputRef/g, 'coverLetterPdfInputRef');
     
  content = content.replace(match[0], match[0] + '\n' + newHandlerStr);
  
  // also inject state `isUploadingCoverLetterPdf`
  const stateStr = `const [isUploadingInternalPdf, setIsUploadingInternalPdf] = useState(false);`;
  const newStateStr = `const [isUploadingCoverLetterPdf, setIsUploadingCoverLetterPdf] = useState(false);`;
  content = content.replace(stateStr, stateStr + '\n  ' + newStateStr);
  
  // also inject `coverLetterPdfInputRef`
  const refStr = `const internalPdfInputRef = useRef<HTMLInputElement>(null);`;
  const newRefStr = `  const coverLetterPdfInputRef = useRef<HTMLInputElement>(null);`;
  content = content.replace(refStr, refStr + '\n' + newRefStr);

  fs.writeFileSync('src/App.tsx', content);
  console.log("Success");
}
