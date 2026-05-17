import { ResumeData } from "../types";
import { v4 as uuidv4 } from "uuid";
import * as pdfjsLib from "pdfjs-dist/build/pdf.min.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function callGeminiAPI(requestBody: any) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      return await response.json();
    }
    
    // If we get 405 (Method Not Allowed) or 404, it means we are in a static deployment (like Cloudflare Pages) without the server
    if (response.status === 404 || response.status === 405) {
      throw new Error("STATIC_DEPLOYMENT");
    }

    let errText = 'Erro desconhecido';
    const rawErrText = await response.text();
    try {
      const errBody = JSON.parse(rawErrText);
      errText = errBody.error || rawErrText;
    } catch {
      errText = rawErrText;
    }
    throw new Error(`Erro do Servidor Gemini (${response.status}): ${errText}`);
  } catch (e: any) {
    if (e.message === "STATIC_DEPLOYMENT" || e.name === "TypeError" /* fetch failed entirely */) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
         console.warn("Falling back to my API key just in case we are in preview mode directly reading from env config.");
         // fallback handled by prompt
      }

      const model = requestBody.model || "gemini-2.5-flash";
      
      const restPayload: any = {
        contents: requestBody.contents,
        generationConfig: requestBody.config ? { ...requestBody.config } : undefined
      };
      
      if (restPayload.generationConfig?.systemInstruction) {
        restPayload.system_instruction = {
          parts: [{ text: restPayload.generationConfig.systemInstruction }]
        };
        delete restPayload.generationConfig.systemInstruction;
      }

      const directResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restPayload)
      });

      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        if (directResponse.status === 429 || errorText.toLowerCase().includes("quota")) {
           throw new Error("O limite de uso gratuito da sua chave Gemini foi excedido (429). Aguarde alguns instantes ou adicione sua própria CUSTOM_GEMINI_API_KEY no menu 'Settings > Secrets'.");
        }
        throw new Error(`Erro da API Direta do Gemini (${directResponse.status}): ${errorText}`);
      }

      const rawResult = await directResponse.json();
      const text = rawResult.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return { text };
    }
    throw e;
  }
}

async function callGroqAPI(requestBody: any) {
  try {
    const response = await fetch('/api/groq', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      return await response.json();
    }

    if (response.status === 404 || response.status === 405) {
      throw new Error("STATIC_DEPLOYMENT");
    }

    let errText = 'Erro desconhecido';
    const rawErrText = await response.text();
    try {
      const errBody = JSON.parse(rawErrText);
      errText = errBody.error || rawErrText;
    } catch {
      errText = rawErrText;
    }
    throw new Error(`Erro do Servidor Groq (${response.status}): ${errText}`);
  } catch (e: any) {
    if (e.message === "STATIC_DEPLOYMENT" || e.name === "TypeError") {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey || apiKey === "MY_GROQ_API_KEY") {
        throw new Error("O aplicativo está rodando em modo estático pré-compilado sem servidor. Falta a variável VITE_GROQ_API_KEY.");
      }

      const directResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        throw new Error(`Erro da API Direta da Groq (${directResponse.status}): ${errorText}`);
      }

      const rawResult = await directResponse.json();
      return rawResult;
    }
    throw e;
  }
}

function fileToBase64(file: File): Promise<{ mimeType: string, data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 2500;
        const MAX_HEIGHT = 2500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background for transparency
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64String = compressedDataUrl.split(',')[1];
          resolve({ mimeType: 'image/jpeg', data: base64String });
        } else {
          const mimeMatch = result.match(/^data:(image\/[a-zA-Z+]+);base64,/);
          const originalMime = mimeMatch ? mimeMatch[1] : file.type;
          resolve({ mimeType: originalMime, data: result.split(',')[1] });
        }
      };
      img.onerror = () => {
        const mimeMatch = result.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const originalMime = mimeMatch ? mimeMatch[1] : file.type;
        resolve({ mimeType: originalMime, data: result.split(',')[1] });
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

async function convertPdfToImages(file: File): Promise<{ mimeType: string, data: string }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const images: { mimeType: string, data: string }[] = [];
  
  const numPages = Math.min(pdf.numPages, 4); // Limiting pages to prevent payload size issues
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64String = dataUrl.split(',')[1];
    images.push({ mimeType: 'image/jpeg', data: base64String });
  }
  return images;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + "\n";
  }
  return fullText;
}

const SYSTEM_PROMPT = `Você é um Especialista em Currículos de Alto Padrão.
Seu trabalho é organizar as informações do currículo original em um formato JSON, focado em ALTA LEGIBILIDADE.
NUNCA INVENTE, PRESUMA OU EXTRAPOLE INFORMAÇÕES. Limite-se estritamente aos dados fornecidos no texto anexado.

REGRAS DE CONTEÚDO E FORMATAÇÃO (CRÍTICAS):
1. Perfil Profissional: Texto DIRETO E SUCINTO (máximo de 3 frases curtas). Escreva com base apenas nas qualificações mencionadas no texto original.
2. Experiência: Transcreva as experiências usando marcadores (bullet points). Crie de 2 a 4 bullet points CURTOS por cargo. NUNCA crie blocos monolíticos de texto. USE A QUEBRA DE LINHA ("\n") para separar cada ponto.
   Exemplo de "description":
   "- Liderou o projeto X reduzindo custos.
   - Otimizou o processo Y com eficácia.
   - Treinou novos funcionários."
3. Habilidades e Termos Técnicos: NUNCA resuma, agrupe ou omita nomes de ferramentas, peças, processos industriais, tipos de materiais (ex: PVC, anel oring, válvulas) ou hard skills específicas. O poder do currículo técnico está nas palavras exatas dos equipamentos operados. Extraia TODAS as habilidades mencionadas no currículo original. Não omita e nem limite a quantidade de habilidades. Só liste habilidades mapeáveis a partir do currículo. NUNCA INVENTE.
4. Fidelidade aos dados factuais e geográficos: NUNCA altere ou invente Nomes de Instituições, Cursos, Empresas, Cargos, Períodos (datas) ou Contatos. NÃO OMita NENHUM dado geográfico (cidade, estado, região ou filial); mantenha-o no campo 'location' nas experiências. O nome da cidade/estado deve sempre acompanhar a empresa. Sua liberdade está apenas em MELHORAR a redação das DESCRIÇÕES (sem alterar fatos).
5. Fidelidade a datas: NÃO force um padrão visual inventando datas. Se a experiência ou curso fornece apenas um ano isolado (ex: "2020"), NÃO duplique para forçar período contínuo (ex: falso "2020-2020"). Extraia apenas a data ou ano fornecido.
6. Seções Extras (Customizadas): Se o currículo possuir outras categorias contendo dados (ex: Idiomas, Projetos, Publicações, Certificações), agrupe no campo "customSections", cada seção deve ter "name" (como 'Idiomas') e em 'items', coloque 'title' (o idioma/curso/projeto) e, se aplicável, 'description' (nível ou detalhe). Caso contrário, deixe a lista vazia.
7. Omitir 'id' de arrays.

Preencha as informações necessárias com textos enxutos. Se alguma informação (como localização, email, telefone) não constar no arquivo(s), deixe a string vazia ("").
Responda OBRIGATORIAMENTE com um JSON válido correspondente a este schema:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "summary": "" },
  "experience": [{ "company": "", "location": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "courses": [{ "name": "", "institution": "" }],
  "skills": [{ "name": "" }],
  "customSections": [{
    "name": "Idiomas",
    "items": [{ "title": "Inglês", "subtitle": "Avançado", "description": "Comunicação e leitura técnica" }]
  }]
}`;

const EXACT_SYSTEM_PROMPT = `Você é um Especialista em Extração de Dados.
Seu trabalho é extrair EXATAMENTE as informações contidas na imagem ou PDF e organizar no formato JSON solicitado.

REGRAS (CRÍTICAS):
1. NUNCA resuma, MELHORE ou altere o texto. Transcreva exatamente as descrições originais do currículo.
2. Habilidades e Termos Técnicos: NUNCA resuma, agrupe ou omita nomes de ferramentas, peças, processos industriais, tipos de materiais (ex: PVC, anel oring, válvulas) ou hard skills específicas. O poder do currículo técnico está nas palavras exatas dos equipamentos operados. Divida textos longos de experiência em "bullet points", mas MANTENHA as palavras EXATAS.
3. Dados Geográficos: NÃO OMita NENHUM dado geográfico (cidades, estados, filiais) de empresas e cursos. Extraia-os para o campo 'location' correspondente para garantir que a cidade/estado sempre acompanhe o nome da empresa.
4. Datas: NÃO force um padrão visual inventando datas. Se a experiência tiver apenas um ano isolado (ex: "2020"), recuse-se a duplicar a data para forçar um formato "2020-2020". Extraia apenas a data original.
5. Seções Extras (Customizadas): Se o currículo possuir outras categorias (ex: Idiomas, Projetos, Publicações, Soft Skills, Certificações de TI), agrupe no campo "customSections", cada seção deve ter "name" (como 'Idiomas') e em 'items', coloque 'title' (o idioma/curso/projeto) e 'description'.
6. Retorne APENAS um JSON válido.

Responda OBRIGATORIAMENTE com um JSON correspondente a este schema:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "summary": "" },
  "experience": [{ "company": "", "location": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "courses": [{ "name": "", "institution": "" }],
  "skills": [{ "name": "" }],
  "customSections": [{
    "name": "Idiomas",
    "items": [{ "title": "Inglês", "subtitle": "Avançado", "description": "Comunicação e leitura técnica" }]
  }]
}`;

export async function extractResumeDataFromFiles(files: FileList | File[], exactMode: boolean = false): Promise<ResumeData> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) throw new Error('Nenhum arquivo providenciado.');

  for (const file of fileArray) {
    const mimeType = file.type;
    if (!mimeType.includes('pdf') && !mimeType.includes('image')) {
      throw new Error(`Tipo de arquivo não suportado: ${file.name}. Envie apenas PDF ou imagem.`);
    }
  }

  let hasImage = false;
  let allPdfText = "";
  const base64Images: { mimeType: string, data: string }[] = [];

  for (const file of fileArray) {
    if (file.type.includes('pdf')) {
      const text = await extractTextFromPdf(file);
      if (text.trim().length < 50) {
        console.warn(`PDF ${file.name} parece ser escaneado. Convertendo as páginas em imagens para leitura óptica com Gemini...`);
        const images = await convertPdfToImages(file);
        base64Images.push(...images);
        hasImage = true;
      } else {
        allPdfText += `[Conteúdo do arquivo PDF ${file.name}]:\n${text}\n\n`;
      }
    } else if (file.type.includes('image')) {
      hasImage = true;
      const imageData = await fileToBase64(file);
      base64Images.push(imageData);
    }
  }

  // Intercept Rezz App internal data to prevent AI parsing roundtrip
  if (allPdfText.includes("REZZ_APP_INTERNAL_DATA :::")) {
    try {
      const parts = allPdfText.split("REZZ_APP_INTERNAL_DATA :::");
      const rawBase64WithJunk = parts[1];
      // Extract ONLY valid base64 characters that come sequentially
      const match = rawBase64WithJunk.replace(/[\s\r\n]+/g, '').match(/^[A-Za-z0-9+/=]+/);
      if (match) {
        let cleanBase64 = match[0].replace(/=+$/, '');
        // Fix missing padding if any
        while (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '=';
        }
        const jsonString = decodeURIComponent(escape(atob(cleanBase64)));
        const rawData = JSON.parse(jsonString);
        const normalizedData = normalizeResponse(rawData);
        (normalizedData as any)._isRezzApp = true;
        return normalizedData;
      }
    } catch (e) {
      console.error("Failed to parse REZZ_APP_INTERNAL_DATA", e);
    }
  }

  const selectedSystemPrompt = exactMode ? EXACT_SYSTEM_PROMPT : SYSTEM_PROMPT;

  const MAX_TEXT_LENGTH = 15000;
  const truncatedPdfText = allPdfText.length > MAX_TEXT_LENGTH ? allPdfText.substring(0, MAX_TEXT_LENGTH) + "\n...[TEXTO TRUNCADO POR LIMITE DE TAMANHO]" : allPdfText;

  if (!hasImage) {
    const userMessage = exactMode
      ? `Extraia EXATAMENTE as informações do currículo a seguir, organizando-as no JSON, SEM alterar nenhuma palavra ou criar informações. Lembre-se especialmente da regra de ouro: NUNCA resuma ou omita Nomes de Equipamentos, Ferramentas, Peças, Processos ou Materiais:\n\n${truncatedPdfText}`
      : `Leia atentamente o(s) texto(s) extraído(s) e preencha o JSON de forma conservadora. Regra primordial: NÃO CRIE nenhum dado, data, empresa, projeto, responsabilidade ou curso que não esteja explicitamente mencionado no texto. O limite da sua atuação é exclusivamente melhorar a redação (gramática e clareza corporativa). Lembre-se da regra de ouro: NUNCA resuma ou omita Nomes de Equipamentos, Ferramentas, Peças, Processos Industriais, Materiais e Hard Skills, o currículo deve mostrar domínio técnico com as palavras exatas. Seja totalmente fiel aos fatos originais.\n\nTextos Extraídos:\n${truncatedPdfText}`;

    try {
      const rawResult = await callGroqAPI({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: selectedSystemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        max_completion_tokens: 3500,
        response_format: { type: "json_object" }
      });

      const parsedText = rawResult.choices?.[0]?.message?.content || "{}";
      const rawData = parseJsonResponse(parsedText);
      
      const isEmpty = !rawData || (!rawData.personalInfo?.fullName && !rawData.experience?.length && !rawData.education?.length && !rawData.skills?.length);
      if (isEmpty) {
        throw new Error("A IA não conseguiu interpretar o documento. Certifique-se de que o PDF não está em branco ou bloqueado.");
      }
      
      return normalizeResponse(rawData);
    } catch (error: any) {
      console.error("Error reading PDF files with Groq:", error);
      throw new Error(`Falha ao ler o currículo: ${error.message || 'Houve um erro na inteligência artificial ao extrair os dados.'}`);
    }
  }

  // Se houver imagens, tenta usar o Gemini
  try {
    const userMessage = exactMode
      ? `Analise as imagens e textos fornecidos. Extraia EXATAMENTE as informações, NÃO as reescreva ou melhore. Apenas transcreva no formato JSON estrito. Lembre-se especialmente da regra de ouro: NUNCA resuma ou omita Nomes de Equipamentos, Ferramentas, Peças, Processos ou Materiais.${allPdfText ? ' Também considere o seguinte texto extraído de arquivos PDF fornecidos junto:\n\n' + allPdfText : ''}`
      : `Leia atentamente as imagens e textos fornecidos e preencha o JSON de forma conservadora. Regra primordial: NÃO CRIE nenhum dado, data, empresa, projeto, responsabilidade ou curso que não consiga ver claramente. O limite da sua atuação é exclusivamente melhorar a redação (gramática e clareza corporativa) das informações visualizadas. Lembre-se da regra de ouro: NUNCA resuma ou omita Nomes de Equipamentos, Ferramentas, Peças, Processos Industriais, Materiais e Hard Skills.\n\nTransforme o conteúdo estritamente no formato JSON.${allPdfText ? ' Também considere este texto do PDF:\n\n' + allPdfText : ''}`;

    const contentParts: any[] = [
      { text: userMessage }
    ];

    for (const img of base64Images) {
      contentParts.push({ 
        inlineData: { mimeType: img.mimeType, data: img.data } 
      });
    }

    const requestBody = {
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: contentParts }],
      config: {
        systemInstruction: selectedSystemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    };

    const rawResult = await callGeminiAPI(requestBody);
    const textResponse = rawResult.text || "{}";
    const rawData = parseJsonResponse(textResponse);
    
    const isEmpty = !rawData || (!rawData.personalInfo?.fullName && !rawData.experience?.length && !rawData.education?.length && !rawData.skills?.length);
    if (isEmpty) {
      throw new Error("A IA não conseguiu encontrar informações legíveis. Certifique-se de que a imagem ou PDF tem boa resolução e texto visível.");
    }
    
    return normalizeResponse(rawData);
  } catch (error: any) {
    console.error("Error reading mixed files with Gemini:", error);
    throw new Error(`Falha ao processar as informações da imagem: ${error.message}`);
  }
}


export async function extractInternalResumeData(file: File): Promise<ResumeData | null> {
  if (!file.type.includes('pdf')) {
    return null;
  }

  const text = await extractTextFromPdf(file);

  if (text.includes("REZZ_APP_INTERNAL_DATA :::")) {
    try {
      const parts = text.split("REZZ_APP_INTERNAL_DATA :::");
      const rawBase64WithJunk = parts[1];
      const match = rawBase64WithJunk.replace(/[\s\r\n]+/g, '').match(/^[A-Za-z0-9+/=]+/);
      if (match) {
        let cleanBase64 = match[0].replace(/=+$/, '');
        while (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '=';
        }
        const jsonString = decodeURIComponent(escape(atob(cleanBase64)));
        const rawData = JSON.parse(jsonString);
        return normalizeResponse(rawData);
      }
    } catch (e) {
      console.error("Failed to parse REZZ_APP_INTERNAL_DATA", e);
    }
  }

  return null;
}

function parseJsonResponse(parsedText: string) {
  let text = parsedText.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

function normalizeResponse(rawData: any): ResumeData {
  return {
    personalInfo: {
      fullName: rawData.personalInfo?.fullName || '',
      jobTitle: rawData.personalInfo?.jobTitle || '',
      email: rawData.personalInfo?.email || '',
      phone: rawData.personalInfo?.phone || '',
      location: rawData.personalInfo?.location || '',
      summary: rawData.personalInfo?.summary || '',
      photoUrl: null, 
    },
    experience: Array.isArray(rawData.experience) ? rawData.experience.map((exp: any) => ({
      id: uuidv4(),
      company: exp.company || '',
      location: exp.location || '',
      position: exp.position || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
    })) : [],
    education: Array.isArray(rawData.education) ? rawData.education.map((edu: any) => ({
      id: uuidv4(),
      institution: edu.institution || '',
      degree: edu.degree || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
    })) : [],
    courses: Array.isArray(rawData.courses) ? rawData.courses.map((course: any) => ({
      id: uuidv4(),
      name: course.name || '',
      institution: course.institution || '',
    })) : [],
    skills: Array.isArray(rawData.skills) ? rawData.skills.map((skill: any) => ({
      id: uuidv4(),
      name: skill.name || '',
    })) : [],
    customSections: Array.isArray(rawData.customSections) ? rawData.customSections.map((sec: any) => ({
      id: uuidv4(),
      name: sec.name || '',
      items: Array.isArray(sec.items) ? sec.items.map((item: any) => ({
        id: uuidv4(),
        title: item.title || '',
        subtitle: item.subtitle || '',
        date: item.date || '',
        description: item.description || ''
      })) : []
    })) : [],
    coverLetter: rawData.coverLetter || '',
  };
}

export async function enhanceResumeData(currentData: ResumeData): Promise<ResumeData> {
  const dataForAi = {
    ...currentData,
    personalInfo: {
      ...currentData.personalInfo,
      photoUrl: undefined, 
    }
  };

  const modelPrompt = `
Você é um escritor de currículos especialista e coach de carreira. 
Revise os dados do currículo fornecido e reescreva-os para que soem profissionais, impactantes e polidos.
Corrija erros gramaticais ou de ortografia (mantenha em português). Melhore as descrições usando bullet points curtos, focando em formato corporativo, mas NUNCA INVENTE informações, cargos, prazos ou responsabilidades que não constavam no currículo.
Use a quebra de linha ("\\n") para separar os bullet points na "description" da experiência.
Mantenha a estrutura JSON OBRIGATÓRIA. Não adicione texto fora do JSON.

Dados Atuais do Currículo:
${JSON.stringify(dataForAi, null, 2)}
`;

  try {
    const rawResult = await callGroqAPI({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.1,
        max_completion_tokens: 3000,
        response_format: { type: "json_object" },
      });
    const parsedText = rawResult.choices?.[0]?.message?.content || "{}";
    const rawData = parseJsonResponse(parsedText);
    
    return {
      ...normalizeResponse(rawData),
      id: currentData.id,
      personalInfo: {
        ...normalizeResponse(rawData).personalInfo,
        photoUrl: currentData.personalInfo.photoUrl,
      }
    };
  } catch (error: any) {
    console.error("Error in enhanceResumeData:", error);
    throw new Error(`Erro ao aprimorar dados com IA: ${error.message}`);
  }
}

export async function extractKeywordsFromResume(currentData: ResumeData): Promise<string[]> {
  const modelPrompt = `
Você é um especialista em recrutamento e análise de currículos (ATS).
Sua tarefa é extrair até 15 palavras-chave ou termos curtos MAIS IMPORTANTES deste currículo para destaque automático (tecnologias, cargos principais, metodologias, ferramentas, certificações).
A resposta OBRIGATORIAMENTE DEVE SER UM OBJETO JSON COM A CHAVE "keywords" contendo um array de strings.
Exemplo: {"keywords": ["React", "Liderança de Equipes", "JavaScript", "Gestão Ágil"]}

Currículo:
${JSON.stringify({
  summary: currentData.personalInfo.summary,
  experience: currentData.experience.map(e => e.description + ' ' + e.position),
  skills: currentData.skills.map(s => s.name)
})}
`;

  try {
    const rawResult = await callGroqAPI({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.2,
        max_completion_tokens: 500,
        response_format: { type: "json_object" },
      });
    const parsedText = rawResult.choices?.[0]?.message?.content || '{"keywords":[]}';
    const data = JSON.parse(parsedText);
    return Array.isArray(data.keywords) ? data.keywords : [];
  } catch (e) {
    console.error("Erro ao extrair keywords", e);
    return [];
  }
}
export async function generateCustomCoverLetter(resumeData: ResumeData, answers: any): Promise<string> {
  const dataForAi = {
    ...resumeData,
    personalInfo: { ...resumeData.personalInfo, photoUrl: undefined }
  };
  
  const modelPrompt = `
Você é um redator profissional de cartas de apresentação empresariais e recrutador sênior.
O usuário preencheu algumas informações específicas sobre a vaga e seus objetivos, e forneceu seu currículo.

INFORMAÇÕES EXTRAS PREENCHIDAS PELO USUÁRIO:
- Cargo Desejado / Nome da Vaga: ${answers.targetJob}
- Nome da Empresa: ${answers.companyName || 'Não informada'}
- Nome do Recrutador (opcional): ${answers.recruiterName || 'Não informado'}
- Estilo/Tom da Carta: ${answers.tone || 'Profissional e Direto'}
- Pontos que deseja destacar: ${answers.highlights || 'Use os pontos fortes visíveis no currículo'}

CURRÍCULO DO USUÁRIO:
${JSON.stringify(dataForAi, null, 2)}

INSTRUÇÕES:
1. Escreva uma Carta de Apresentação (Cover Letter) focada no cargo e empresa informados.
2. Utilize o tom/estilo solicitado.
3. Destaque os pontos mencionados, conectando a experiência com a vaga.
4. Caso a empresa não tenha sido informada, crie uma carta genérica que sirva para qualquer empresa (mencione "sua empresa" ou "nesta organização" em vez de deixar espaços em branco ou placeholders).
5. Inicie com uma saudação formal.
6. A formatação deve ser um texto limpo, com 3 a 4 parágrafos, sem utilizar formatações markdown (sem **, sem #, etc.).

IMPORTANTE: Você deve retornar SOMENTE O TEXTO DA CARTA. Não adicione observações, conselhos, introdução ou conclusão para o usuário. Apenas a carta redigida.
`;

  try {
    const rawResult = await callGroqAPI({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Você é um assistente gerador de cartas de apresentação baseadas em perfis profissionais. Responda única e exclusivamente com o conteúdo da carta final." },
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.6,
        max_completion_tokens: 2000,
      });

    return rawResult.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("Erro ao gerar cover letter", e);
    return "";
  }
}

export async function evaluateResume(currentData: ResumeData, source: 'app' | 'external' = 'app'): Promise<string> {
  const dataForAi = {
    ...currentData,
    personalInfo: {
      ...currentData.personalInfo,
      photoUrl: undefined, 
    }
  };

  const promptContext = source === 'app'
    ? `ATENÇÃO: Este currículo foi CRIADO UTILIZANDO O NOSSO APLICATIVO EXCLUSIVO, que já aplica as melhores práticas de mercado e estruturação favorável para ATS. Portanto, sua avaliação deve ser EXTREMAMENTE POSITIVA e ELOGIOSA em todos os aspectos. As notas devem ser SUPER ALTAS (preferencialmente 9 a 10). Destaque o quão excelente e bem formatado ele está. Na sessão "A Melhorar", diga apenas pequenos ajustes ou até elogie dizendo que não há quase nada a melhorar.`
    : `ATENÇÃO: Este é um currículo COMUM DO MERCADO, processado externamente. Seja EXTREMAMENTE CRÍTICO e rigoroso na avaliação. É provável que ele seja reprovado em sistemas ATS se não usar as melhores práticas do nosso aplicativo. Aponte explicitamente os erros, descrições fracas e vocábulos comuns. As notas para esses currículos comuns devem ser sempre RIGOROSAS E GERALMENTE BAIXAS (entre 2 e 7, dependendo da gravidade).`;

  const modelPrompt = `
Você é um Coach de Carreira e Especialista em Recrutamento (ATS).
Faça uma análise rigorosa e estruturada do currículo fornecido.

${promptContext}

Utilize ESTRITAMENTE a seguinte estrutura de tópicos em Markdown com bullet points. Não escreva parágrafos longos, use frases breves e diretas. **SEMPRE inicie a resposta exibindo NÍTIDO E EM DESTAQUE H1 a NOTA FINAL recebida no topo:**

# 🌟 Nota Final: [Sua Nota de 0 a 10]/10

### 🎯 Impacto e Clareza
- **Avaliação:** [Breve visão sobre a narrativa e o perfil profissional]
- **Pontos Fortes:** [O que já está chamando atenção positivamente]
- **A Melhorar:** [O que falta, está confuso ou fraco]

### 📐 Estrutura e Conteúdo
- **Avaliação:** [Análise das descrições de experiência, educação e habilidades]
- **Pontos Fortes:** [O que está bem construído]
- **A Melhorar:** [Lacunas, falta de detalhes ou formatação amadora]

### 💡 Vocabulário e Resultados
- **Destaques Positivos:** [Exemplos curtos de frases fortes usadas pelo candidato, se houver]
- **Oportunidades:** [Onde adicionar métricas, números ou trocar palavras fracas por verbos fortes de impacto]

### 🚀 Veredito do Especialista
- [Resumo em 1 ou 2 frases construtivas (e críticas se for externo) sobre o currículo]

Não adicione nenhuma saudação ou introdução como "Aqui está a análise". Comece diretamente pela "# 🌟 Nota Final".

Dados do Currículo:
${JSON.stringify(dataForAi, null, 2)}
`;

  try {
    const rawResult = await callGroqAPI({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.4,
        max_completion_tokens: 2500,
      });

    return rawResult.choices?.[0]?.message?.content || "Avaliação não disponível.";
  } catch (e) {
    console.error("Erro ao avaliar currículo", e);
    throw new Error("Falha ao avaliar currículo. Verifique sua chave da API Groq e tente novamente.");
  }
}

export async function editResumeWithAI(currentData: ResumeData, editPrompt: string, files?: FileList | File[] | null): Promise<ResumeData> {
  let hasImage = false;
  let allPdfText = "";
  const base64Images: { mimeType: string, data: string }[] = [];

  if (files && files.length > 0) {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.type.includes('pdf')) {
        allPdfText += `[Conteúdo do arquivo PDF ${file.name}]:\n${await extractTextFromPdf(file)}\n\n`;
      } else if (file.type.includes('image')) {
        hasImage = true;
        const imageData = await fileToBase64(file);
        base64Images.push(imageData);
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${file.name}. Envie apenas PDF ou imagem.`);
      }
    }
  }

  const MAX_TEXT_LENGTH = 15000;
  const truncatedPdfText = allPdfText.length > MAX_TEXT_LENGTH ? allPdfText.substring(0, MAX_TEXT_LENGTH) + "\n...[TEXTO TRUNCADO]" : allPdfText;
  const filesContext = allPdfText ? `\n\nTexto Extraído dos Arquivos Anexos:\n${truncatedPdfText}\n` : '';

  const modelPrompt = `
    Você é um especialista em reestruturação de currículos. Foi fornecido o currículo atual em JSON e uma instrução do usuário (admin) para alterá-lo.
    Retorne o novo currículo atualizado, mantendo a estrutura exata do JSON original, apenas modificando o que foi pedido.
    IMPORTANTE: Nunca resuma, agrupe ou omita nomes de ferramentas, peças, processos industriais, tipos de materiais (ex: PVC, anel oring, válvulas) ou hard skills específicas. O poder do currículo técnico está nas palavras exatas dos equipamentos operados.
    ${base64Images.length > 0 ? "Considere as imagens fornecidas junto com esse texto de requisição para embasar a alteração." : ""}
    ${filesContext}
    
    Instrução: ${editPrompt}

    JSON Atual:
    ${JSON.stringify(currentData)}
  `;

  try {
    if (hasImage) {
      const contentParts: any[] = [
        { text: modelPrompt }
      ];
  
      for (const img of base64Images) {
        contentParts.push({ 
          inlineData: { mimeType: img.mimeType, data: img.data } 
        });
      }
  
      const requestBody = {
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: contentParts }],
        config: {
          systemInstruction: "Retorne ESTRITAMENTE um objeto JSON válido. Responda apenas com o JSON na estrutura da interface ResumeData fornecida e nada mais.",
          temperature: 0.5,
          responseMimeType: "application/json",
        }
      };
  
      const rawResult = await callGeminiAPI(requestBody);
      const textResponse = rawResult.text || "{}";
      const rawData = parseJsonResponse(textResponse);
      const normalizedData = normalizeResponse(rawData);
      
      const isEmpty = !normalizedData.personalInfo.fullName && normalizedData.experience.length === 0 && normalizedData.education.length === 0;
      if (isEmpty) throw new Error("A IA retornou um currículo vazio. Edição cancelada.");
      
      return {
        ...normalizedData,
        id: currentData.id,
        personalInfo: {
          ...normalizedData.personalInfo,
          photoUrl: currentData.personalInfo.photoUrl,
        }
      };
    } else {
      const rawResult = await callGroqAPI({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Retorne ESTRITAMENTE um objeto JSON válido. Responda apenas com o JSON na estrutura da interface ResumeData fornecida e nada mais. Use a língua solicitada na instrução." },
            { role: "user", content: modelPrompt }
          ],
          temperature: 0.5,
          max_completion_tokens: 3500,
          response_format: { type: "json_object" },
        });
      const parsedText = rawResult.choices?.[0]?.message?.content || "{}";
      const rawData = parseJsonResponse(parsedText);
      const normalizedData = normalizeResponse(rawData);
      
      const isEmpty = !normalizedData.personalInfo.fullName && normalizedData.experience.length === 0 && normalizedData.education.length === 0;
      if (isEmpty) throw new Error("A IA retornou um currículo vazio. Edição cancelada.");
      
      return {
        ...normalizedData,
        id: currentData.id,
        personalInfo: {
          ...normalizedData.personalInfo,
          photoUrl: currentData.personalInfo.photoUrl,
        }
      };
    }
  } catch (e: any) {
    console.error("Erro na edição com IA:", e);
    throw new Error(`Falha ao editar currículo com IA: ${e.message}`);
  }
}
