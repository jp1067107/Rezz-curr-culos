const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /{appState === 'my-cover-letters'[\s\S]*?(?={appState === 'my-resumes')/;
const match = content.match(regex);
if (match) {
  let myCoverStr = match[0];
  myCoverStr = myCoverStr
      .replace(/internalPdfInputRef/g, 'coverLetterPdfInputRef')
      .replace(/isUploadingInternalPdf/g, 'isUploadingCoverLetterPdf')
      .replace(/handleUploadInternalPdfChange/g, 'handleUploadCoverLetterPdfChange');
      
  content = content.replace(match[0], myCoverStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success");
} else {
  console.log("Not found my-cover-letters block that ends just before my-resumes block.");
  
  // Alternative regex
  const regex2 = /{appState === 'my-cover-letters'[\s\S]*?(?={appState === 'purchased-view')/;
  const match2 = content.match(regex2);
  if (match2) {
    let myCoverStr = match2[0];
    myCoverStr = myCoverStr
      .replace(/internalPdfInputRef/g, 'coverLetterPdfInputRef')
      .replace(/isUploadingInternalPdf/g, 'isUploadingCoverLetterPdf')
      .replace(/handleUploadInternalPdfChange/g, 'handleUploadCoverLetterPdfChange');
      
    content = content.replace(match2[0], myCoverStr);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Success with regex 2");
  } else {
    // try finding the whole block by exact end
    const blockStartStr = `{appState === 'my-cover-letters' && (`;
    let startIdx = content.indexOf(blockStartStr);
    if (startIdx !== -1) {
        let afterStart = content.substring(startIdx);
        let firstAppstateIdx = afterStart.indexOf(`{appState ===`, 50); // find next appstate
        
        let blockToEdit = null;
        if (firstAppstateIdx !== -1) {
            blockToEdit = afterStart.substring(0, firstAppstateIdx);
        } else {
            blockToEdit = afterStart;
        }
        
        let editedBlock = blockToEdit
           .replace(/internalPdfInputRef/g, 'coverLetterPdfInputRef')
           .replace(/isUploadingInternalPdf/g, 'isUploadingCoverLetterPdf')
           .replace(/handleUploadInternalPdfChange/g, 'handleUploadCoverLetterPdfChange');
           
        content = content.substring(0, startIdx) + editedBlock + content.substring(startIdx + blockToEdit.length);
        fs.writeFileSync('src/App.tsx', content);
        console.log("Success manual parse");
    } else {
        console.log("Did not find my-cover-letters block at all");
    }
  }
}
