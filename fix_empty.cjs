const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

function addHasDataCondition(blockStr, idVar, listVar) {
    let exactElseBlock = `} else {
           return [...prev, { id: ${idVar}, ownerId: 'local', data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
       }`;
       
    let newElseBlock = `} else {
          const hasData = data.personalInfo.fullName || data.personalInfo.jobTitle || data.coverLetter || data.summary;
          if (hasData) {
             return [...prev, { id: ${idVar}, ownerId: 'local', data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
          }
          return prev;
       }`;
       
    return blockStr.replace(exactElseBlock, newElseBlock);
}

// 1. replace localPurchasedResumes branch
let resumeIdx = content.indexOf(`setLocalPurchasedResumes(prev => {`);
if (resumeIdx !== -1) {
    let nextEnd = content.indexOf(`});`, resumeIdx) + 3;
    let block = content.substring(resumeIdx, nextEnd);
    let newBlock = addHasDataCondition(block, 'currentResumeId', 'localPurchasedResumes');
    content = content.replace(block, newBlock);
}

// 2. replace localPurchasedCoverLetters branch
let coverIdx = content.indexOf(`setLocalPurchasedCoverLetters(prev => {`);
if (coverIdx !== -1) {
    let nextEnd = content.indexOf(`});`, coverIdx) + 3;
    let block = content.substring(coverIdx, nextEnd);
    let newBlock = addHasDataCondition(block, 'currentCoverLetterId', 'localPurchasedCoverLetters');
    content = content.replace(block, newBlock);
}

// Firebase lists
function addHasDataFirebase(blockStr, idVar, listVar) {
    let exactElseBlock = `} else {
               return [...prev, { id: ${idVar}, ownerId: user.uid, data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
            }`;
            
    let newElseBlock = `} else {
              const hasData = data.personalInfo.fullName || data.personalInfo.jobTitle || data.coverLetter || data.summary;
              if (hasData) {
                 return [...prev, { id: ${idVar}, ownerId: user.uid, data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
              }
              return prev;
            }`;
            
     return blockStr.replace(exactElseBlock, newElseBlock);
}

// 3. firebase resumes
let fbResumeIdx = content.indexOf(`setResumesList(prev => {`);
if (fbResumeIdx !== -1) {
    let nextEnd = content.indexOf(`return prev;
          });`, fbResumeIdx) + 25;
    let block = content.substring(fbResumeIdx, nextEnd);
    let newBlock = addHasDataFirebase(block, 'currentResumeId', 'setResumesList');
    content = content.replace(block, newBlock);
}

// 4. firebase cover letters
let fbCoverIdx = content.indexOf(`setCoverLettersList(prev => {`);
if (fbCoverIdx !== -1) {
    let nextEnd = content.indexOf(`return prev;
          });`, fbCoverIdx) + 25;
    let block = content.substring(fbCoverIdx, nextEnd);
    let newBlock = addHasDataFirebase(block, 'currentCoverLetterId', 'setCoverLettersList');
    content = content.replace(block, newBlock);
}

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed auto-save empty entries.");
