const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /setLocalPurchasedResumes\(prev => \{[\s\S]*?\}\);/;
let match = regex.exec(content);

if (match) {
  let block = match[0];
  let newBlock = `if (appState === 'editor') {
      ${block}
    } else if (appState === 'cover-letter') {
      setLocalPurchasedCoverLetters(prev => {
        const index = prev.findIndex(r => r.id === currentCoverLetterId);
        if (index >= 0) {
           const newLetters = [...prev];
           if (JSON.stringify(newLetters[index].data) !== JSON.stringify(data)) {
             newLetters[index] = { ...newLetters[index], data, updatedAt: new Date().toISOString() };
             return newLetters;
           }
           return prev;
        } else {
           return [...prev, { id: currentCoverLetterId, ownerId: 'local', data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
        }
      });
    }`;
  
  content = content.replace(match[0], newBlock);
}

const firebaseRegex = /const timeoutId = setTimeout\(\(\) => \{[\s\S]*?setResumesList\(prev => \{[\s\S]*?\}\);[\s\S]*?\}, 2000\);/;
match = firebaseRegex.exec(content);

if (match) {
  let block = match[0];
  let newBlock = `const timeoutId = setTimeout(() => {
        if (appState === 'editor') {
          const docUnlocked = unlockedConfigs.filter(cfg => cfg.startsWith(\`\${currentResumeId}_\`));
          saveResume(user.uid, currentResumeId, data, docUnlocked.length > 0 ? docUnlocked : undefined)
            .catch(err => console.error("Auto-save failed", err));
            
          setResumesList(prev => {
            const index = prev.findIndex(r => r.id === currentResumeId);
            if (index >= 0) {
              const newResumes = [...prev];
              if (JSON.stringify(newResumes[index].data) !== JSON.stringify(data)) {
                 newResumes[index] = { ...newResumes[index], data, updatedAt: new Date().toISOString() };
                 return newResumes;
              }
            } else {
               return [...prev, { id: currentResumeId, ownerId: user.uid, data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
            }
            return prev;
          });
        } else if (appState === 'cover-letter') {
          saveCoverLetter(user.uid, currentCoverLetterId, data)
            .catch(err => console.error("Auto-save letter failed", err));
            
          setCoverLettersList(prev => {
            const index = prev.findIndex(r => r.id === currentCoverLetterId);
            if (index >= 0) {
              const newLetters = [...prev];
              if (JSON.stringify(newLetters[index].data) !== JSON.stringify(data)) {
                 newLetters[index] = { ...newLetters[index], data, updatedAt: new Date().toISOString() };
                 return newLetters;
              }
            } else {
               return [...prev, { id: currentCoverLetterId, ownerId: user.uid, data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ResumeDoc];
            }
            return prev;
          });
        }
      }, 2000);`;
      
   content = content.replace(match[0], newBlock);
}

// We need to add currentCoverLetterId to useEffect dependencies!
const depRegex = /\}, \[data, currentResumeId\]\);/;
content = content.replace(depRegex, "}, [data, currentResumeId, currentCoverLetterId, appState]);");

fs.writeFileSync('src/App.tsx', content);
console.log("Success auto-saving fixed");
