const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add ai-info-cover-letter to state
content = content.replace(
  `const [appState, setAppStateInternal] = useState<'onboarding' | 'ai-info' | 'editor' | 'payment-success' | 'affiliate' | 'cover-letter' | 'my-cover-letters' | 'my-resumes' | 'purchased-view'>(() => {`,
  `const [appState, setAppStateInternal] = useState<'onboarding' | 'ai-info' | 'ai-info-cover-letter' | 'editor' | 'payment-success' | 'affiliate' | 'cover-letter' | 'my-cover-letters' | 'my-resumes' | 'purchased-view'>(() => {`
);

// 2. Add handleAiCoverLetterImport string
const oldHandlerStr = `  const handleAiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {`;
const newHandlerStr = `  const handleAiCoverLetterImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessing(true);
      const extractedData = await extractResumeDataFromFiles(files);
      setData(extractedData);
      const newResumeId = uuidv4();
      setCurrentCoverLetterId(newResumeId);
      setLastEnhancedLength(null);
      setAppState('cover-letter');
      setMobileView('preview');
      autoSaveCoverLetterIfAuthenticated(extractedData, newResumeId);
    } catch (error: any) {
      alert(error.message || 'Falha ao extrair dados. Por favor, insira suas informações manualmente.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

`;

content = content.replace(oldHandlerStr, newHandlerStr + oldHandlerStr);


// 3. Add ai-info-cover-letter UI
const aiInfoStart = content.indexOf(`{appState === 'ai-info' && (`);
const onBoardingStart = content.indexOf(`{appState === 'onboarding' && (`); // Need next state to slice exactly
// actually let's find the closing of ai-info
// Or we can just use regex.

fs.writeFileSync('src/App.tsx', content);
console.log("State and handler handled.");
