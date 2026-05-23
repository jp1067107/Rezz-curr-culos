import { ResumeData } from "../types";
import { v4 as uuidv4 } from "uuid";
import * as pdfjsLib from "pdfjs-dist/build/pdf.min.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { jsonrepair } from "jsonrepair";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function callAnthropicAPI(requestBody: any) {
  try {
    const response = await fetch('/api/anthropic', {
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
    throw new Error(`Erro do Servidor Anthropic (${response.status}): ${errText}`);
  } catch (e: any) {
    if (e.message === "STATIC_DEPLOYMENT" || e.name === "TypeError" || e.name === "SyntaxError") {
      const apiKey = localStorage.getItem('rezz_anthropic_api_key') || import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === "MY_ANTHROPIC_API_KEY") {
        throw new Error("API Key da Anthropic não encontrada. Clique no ícone de Configuração (engrenagem) no topo/rodapé da página para inserir sua chave.");
      }

      const modelsToTry = [
        requestBody.model || "claude-sonnet-4-6",
        "claude-sonnet-4-6",
        "claude-opus-4-7",
        "claude-sonnet-4-6",
        "claude-sonnet-4-5-20250929",
        "claude-haiku-4-5-20251001",
        "claude-opus-4-5-20251101"
      ];
      const uniqueModels = Array.from(new Set(modelsToTry));

      let lastErrorText = "";
      let lastStatus = 500;

      for (const currentModel of uniqueModels) {
        const directResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: currentModel,
            system: requestBody.system,
            messages: requestBody.messages,
            temperature: requestBody.temperature || 0.1,
            max_tokens: requestBody.max_tokens || 4096
          })
        });

        if (directResponse.ok) {
           return await directResponse.json();
        }

        const errorText = await directResponse.text();
        lastErrorText = errorText;
        lastStatus = directResponse.status;

        let isNotFoundError = false;
        try {
           const parsedErr = JSON.parse(errorText);
           if (parsedErr?.error?.type === "not_found_error") {
              isNotFoundError = true;
           }
        } catch (err) {}

        if (directResponse.status === 404 || isNotFoundError) {
           console.warn(`[Anthropic Direct] Model ${currentModel} failed with 404, trying next...`);
           continue;
        }

        if (directResponse.status !== 429 && directResponse.status !== 503 && directResponse.status !== 529) {
           break;
        } else {
           await new Promise(r => setTimeout(r, 1500));
        }
      }

      throw new Error(`Erro da API Direta da Anthropic (${lastStatus}): ${lastErrorText}`);
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
    let pageText = '';
    let lastY = -1;
    for (const item of textContent.items as any[]) {
      if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 2) {
        pageText += '\n';
      } else if (lastY !== -1 && item.str.trim() !== '') {
        pageText += ' ';
      }
      pageText += item.str;
      lastY = item.transform[5];
    }
    fullText += pageText.replace(/[ \t]+/g, ' ') + "\n\n";
  }
  return fullText;
}

const SYSTEM_PROMPT = `Você é um Especialista em Currículos de Alto Padrão.
Seu objetivo é organizar e aprimorar os dados do currículo fornecido, retornando ESTRITAMENTE em formato JSON focado em ALTA LEGIBILIDADE corporativa.
NUNCA invente ou extrapole dados, empresas, datas ou cargos. Baseie-se apenas no contexto original.

REGRAS DE CONTEÚDO E FORMATAÇ�1. Perfil Profissional: Texto DIRETO E SUCINTO. Omitir clichês. É estritamente proibido remover especificações como '(ele/dele)' do nome do usuário.
2. Experiência e Separação de Cargos: Você deve isolar CADA CARGO como um item independente e distinto na lista "experience". Se houver múltiplos cargos na mesma empresa ou em empresas diferentes, cada um VAI TER sua própria \`position\`, \`startDate\`, e \`endDate\`. É EXTREMAMENTE PROIBIDO agrupar, juntar ou "mesclar" blocos de texto de cargos diferentes em um só, para evitar deletar informações vitais ou causar confusões com as datas (stutter temporal). Retenha 100% dos substantivos técnicos (ex: 'blindadoras', 'concessionárias'). Pode usar marcadores separados por quebra de linha ("\\n") mantendo o rigor das atividades.
3. Habilidades (Skills): Transcreva TODAS as 'Habilidades e Competências' exatamente com as palavras originais da imagem/texto. Não invente, não resuma, não limite a 15 itens e não substitua soft skills por hard skills. Transcreva-as DE FORMA EXATA, você nunca deve omiti-las, proteja cada palavra técnica validamente extraída.
4. Dados Pessoais e Geográficos: Transcreva o CEP exato no cabeçalho. Você deve OBRIGATORIAMENTE incluir a cidade e o estado ao lado do nome de TODAS as empresas na Experiência e TODAS as instituições na Formação Acadêmica (ex: "Empresa X - São Paulo/SP"). INSIRA A CIDADE/ESTADO APENAS UMA VEZ, SEM REPETIÇÕES na mesma linha.
5. Datas e Separação Temporal (RISCO CRÍTICO): Encontre, identifique e ASSOCIE a data de início e fim CORRETA para cada emprego e cada cargo. Se o candidato tem múltiplos cargos na mesma empresa em períodos diferentes, crie itens separados na seção "experience" com a mesma empresa mas posições e datas ("startDate" e "endDate") independentes. Jamais misture as descrições ou datas de múltiplos cargos em um só bloco, impedindo "gaguez temporal". Se faltarem informações precisas de datas, use o que está no texto (ex: "2019" ou "Atualmente").
6. Educação e Cursos (Zero Omissão Acadêmica): NUNCA delete ou pule níveis de formação (ex: ensino médio, técnico, tecnólogo, especialização). Se houver qualificações ou cursos técnicos e formações concluídas, eles DEVEM ser incluídos na lista de \`education\` ou \`courses\`. Adicione TUDO que for acadêmico ou curso listado no original.
7. Correção Inteligente de OCR: O processo de leitura de PDF/Imagem às vezes introduz erros bizarros de digitação (ex: "maid" ao invés de maio, "Universidadete" ao invés de Universidade, "São Pauly" ao invés de São Paulo). Você deve CORRIGIR essas falhas óbvias de OCR para o português correto, sem inventar nenhum dado novo.
8. Seções Customizadas: Se o currículo possuir outras categorias contendo dados (ex: Idiomas, Projetos), agrupe em "customSections", cada seção deve ter "name" (como 'Idiomas') e em 'items', coloque 'title' (o idioma/curso/projeto) e, se aplicável, 'description' (nível ou detalhe). Caso contrário, deixe a lista vazia.
9. Ordem Original: Mantenha todos os itens (experiência, educação, cursos) EXATAMENTE na mesma ordem cronológica/visual em que aparecem no texto original. NÃO reordene os itens sob nenhuma hipótese.
10. Omita 'id' na saída do JSON.
11. FORMATO DO JSON (CRÍTICO): Você DEVE escapar obrigatoriamente quaisquer aspas duplas (") que apareçam dentro dos valores de texto usando uma barra invertida (\\"). Jamais deixe aspas duplas sem escape no meio de um valor string. O JSON deve ser 100% válido sintaticamente.

Responda OBRIGATORIAMENTE com um JSON válido correspondente a este schema:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "summary": "" },
  "experience": [{ "company": "", "location": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "courses": [{ "name": "", "institution": "", "date": "" }],
  "skills": [{ "name": "" }],
  "customSections": [{
    "name": "Idiomas",
    "items": [{ "title": "Inglês", "subtitle": "Avançado", "description": "Comunicação e leitura técnica" }]
  }]
}`;

const EXACT_SYSTEM_PROMPT = `Você é um Robô de Transcrição Literal.
Sua ÚNICA função é converter os textos e imagens recebidos em um JSON EXATAMENTE como estão.
Você está TERMINANTEMENTE PROIBIDO de adicionar, diminuir, excluir ou aprimorar qualquer palavra.

REGRAS (CRÍTICAS E ABSOLUTAS):
1. TRANSCRIÇÃO LITERAL: O que está escrito deve ir para o JSON exatamente com as MESMAS palavras e a MESMA gramática. NUNCA resuma, não use sinônimos, não melhore o texto. O texto do currículo original é imutável.
2. ZERO OMISSÃO: Você NÃO pode deletar NENHUMA informação do texto original. TUDO que for experiência, curso, conhecimento ou detalhe precisa estar presente no JSON. Copie todas as ferramentas, peças, processos, informações.
3. SEM ADIÇÕES: NÃO crie detalhes que não existem no texto base (NUNCA). Se não está no currículo, não estará no JSON.
4. Experiência: Se for quebrar textos longos em "bullet points", NÃO altere nenhuma palavra. Use as mesmas palavras exatas.
5. Habilidades (Skills): Transcreva TODAS as habilidades EXATAMENTE como estão listadas no currículo original. Não adicione e não corte itens, nem tente substituir soft por hard skills. TUDO deve ser copiado.
6. Dados Geográficos, Datas e Cargos Múltiplos (RISCO CRÍTICO): Copie-os exatamente como aparecem. Se um candidato ocupou vários cargos na mesma empresa, separe-os RIGOROSAMENTE em itens de "experience" independentes, cada um com seu respectivo startDate, endDate e position, para impedir que blocos de texto se aglutinem. Nunca force um formato de data, deixe-o do jeito que o currículo trouxe (ex: "mai de 2019" ou "05/2019").
7. Educação e Cursos: Adicione todos os níveis de formação, cursos técnicos, tecnólogos e especializações que a pessoa listou sem pular nenhum.
8. ORDEM ORIGINAL: As experiências e cursos DEVEM aparecer no JSON na exata mesma ordem em que estão listadas no texto original, de cima para baixo. É ESTRITAMENTE PROIBIDO reordenar as experiências ao tentar aplicar ordem cronológica. Confie na ordem visual do texto.
9. Retorne APENAS um JSON válido. O JSON não será rejeitado caso tenha textos mal escritos, desde que representem fielmente o que estava no documento original.
10. FORMATO DO JSON (CRÍTICO): Você DEVE escapar obrigatoriamente quaisquer aspas duplas (") que apareçam dentro dos valores de texto usando uma barra invertida (\\"). Jamais deixe aspas duplas sem escape no meio de um valor string. O JSON deve ser 100% válido sintaticamente.

Responda OBRIGATORIAMENTE com um JSON correspondente a este schema:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "summary": "" },
  "experience": [{ "company": "", "location": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "courses": [{ "name": "", "institution": "", "date": "" }],
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
      ? `IMPORTANTE: TRANSCRIÇÃO LITERAL E RIGOROSA.\nExtraia EXATAMENTE as informações do currículo a seguir, organizando-as no JSON, SEM alterar, adicionar ou remover nenhuma palavra ou letramento, preservando a gramática e os fatos originais. Adicione todos os cursos. PRESERVE as datas e descrições originais. Separe cargos múltiplos da mesma empresa em itens individuais na "experience". MANTENHA A ORDEM ORIGINAL DE TODOS OS ITENS, NÃO REORDENE NADA.\n\n${truncatedPdfText}`
      : `Leia atentamente o(s) texto(s) extraído(s) e preencha o JSON de forma conservadora. Regra primordial: NÃO CRIE nenhum dado. O limite da sua atuação é apenas a apresentação. Zero Omissão Técnica, Habilidades Exatas, e Zero Omissão Acadêmica. PRESERVE datas intactas, desmembrando e separando rigorosamente cada cargo distinto para evitar aglutinação temporal. Corrija pequenos erros óbvios de OCR (ex: 'maid' -> 'maio') mas seja totalmente fiel aos fatos originais.\n\nTextos Extraídos:\n${truncatedPdfText}`;

    try {
      const rawResult = await callAnthropicAPI({
        model: "claude-sonnet-4-6",
        system: selectedSystemPrompt + "\nRetorne um objeto JSON.",
        messages: [
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 4096
      });

      const parsedText = rawResult.content?.[0]?.text || "{}";
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

  // Se houver imagens, tenta usar a IA
  try {
    const userMessage = exactMode
      ? `IMPORTANTE: TRANSCRIÇÃO LITERAL E RIGOROSA.\nAnalise as imagens e textos fornecidos. Extraia EXATAMENTE as informações. Apenas transcreva no formato JSON idêntico ao currículo, sem aprimorar ou omitir informações. Preserve descrições originais e separe cada cargo rigorosamente. MANTENHA A ORDEM ORIGINAL DE TODOS OS ITENS, NÃO REORDENE NADA.${allPdfText ? ' Também considere o seguinte texto extraído de arquivos PDF fornecidos junto:\n\n' + allPdfText : ''}`
      : `Leia atentamente as imagens e textos fornecidos e preencha o JSON de forma conservadora. NÃO CRIE dados. O limite da sua atuação é a apresentação. Zero Omissão Técnica e Zero Omissão Acadêmica. PRESERVE datas intactas separando cada item de cargo e emprego para nunca recriar fluxos cronológicos ou fundi-los. Corrija perfeitamente erros óbvios de OCR de PDFs (ex: 'maid' -> 'maio', 'Universidadete' -> Universidade).\n\nTransforme o conteúdo estritamente no formato JSON.${allPdfText ? ' Também considere este texto do PDF:\n\n' + allPdfText : ''}`;

    const contentParts: any[] = [
      { type: "text", text: userMessage }
    ];

    for (const img of base64Images) {
      contentParts.push({ 
        type: "image",
        source: { type: "base64", media_type: img.mimeType, data: img.data }
      });
    }

    const rawResult = await callAnthropicAPI({
      model: "claude-sonnet-4-6",
      system: selectedSystemPrompt + "\nRetorne ESTRITAMENTE um objeto JSON.",
      messages: [{ role: "user", content: contentParts }],
      temperature: 0.1,
      max_tokens: 4096
    });

    const textResponse = rawResult.content?.[0]?.text || "{}";
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
  
  try {
    return JSON.parse(text);
  } catch (err: any) {
    console.warn("Standard JSON parse failed, attempting repair:", err.message);
    try {
      const repaired = jsonrepair(text);
      return JSON.parse(repaired);
    } catch (repairErr: any) {
      console.error("JSON repair also failed:", repairErr);
      throw new Error(`Falha ao ler o currículo documentado: ${err.message}`);
    }
  }
}

function normalizeResponse(rawData: any): ResumeData {
  return {
    personalInfo: {
      fullName: rawData.personalInfo?.fullName || '',
      jobTitle: rawData.personalInfo?.jobTitle || '',
      email: rawData.personalInfo?.email || '',
      phone: rawData.personalInfo?.phone || '',
      location: rawData.personalInfo?.location || '',
      linkedin: rawData.personalInfo?.linkedin || '',
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
      date: course.date || '',
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
    const rawResult = await callAnthropicAPI({
        model: "claude-sonnet-4-6",
        system: SYSTEM_PROMPT + "\nRetorne ESTRITAMENTE um JSON.",
        messages: [
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4096
      });
    const parsedText = rawResult.content?.[0]?.text || "{}";
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
    const rawResult = await callAnthropicAPI({
        model: "claude-sonnet-4-6",
        messages: [
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1024
      });
    const parsedText = rawResult.content?.[0]?.text || '{"keywords":[]}';
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
    const rawResult = await callAnthropicAPI({
        model: "claude-sonnet-4-6",
        system: "Você é um assistente gerador de cartas de apresentação baseadas em perfis profissionais. Responda única e exclusivamente com o conteúdo da carta final.",
        messages: [
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.6,
        max_tokens: 2048,
      });

    return rawResult.content?.[0]?.text || "";
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
    const rawResult = await callAnthropicAPI({
        model: "claude-sonnet-4-6",
        messages: [
          { role: "user", content: modelPrompt }
        ],
        temperature: 0.4,
        max_tokens: 2500,
      });

    return rawResult.content?.[0]?.text || "Avaliação não disponível.";
  } catch (e) {
    console.error("Erro ao avaliar currículo", e);
    throw new Error("Falha ao avaliar currículo. Verifique sua chave da API Anthropic e tente novamente.");
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
    Você é um especialista em reestruturação de currículos. Foi fornecido o currículo atual em JSON e uma instrução do usuário para alterá-lo.
    Retorne o novo currículo atualizado, mantendo a estrutura exata do JSON original, apenas modificando o que foi pedido.
    IMPORTANTE: Ao adicionar ou modificar habilidades (skills), não as resuma, não substitua soft skills por hard skills, e mantenha todas de forma exata. Zero Omissão Técnica: É estritamente proibido excluir nomes de ferramentas, peças, processos ou especificações técnicas da experiência ou do currículo.
    ${base64Images.length > 0 ? "Considere as imagens fornecidas junto com esse texto de requisição para embasar a alteração." : ""}
    ${filesContext}
    
    Instrução: ${editPrompt}

    JSON Atual:
    ${JSON.stringify(currentData)}
  `;

  try {
    if (hasImage) {
      const contentParts: any[] = [
        { type: "text", text: modelPrompt }
      ];
  
      for (const img of base64Images) {
        contentParts.push({ 
          type: "image",
          source: { type: "base64", media_type: img.mimeType, data: img.data }
        });
      }
  
      const rawResult = await callAnthropicAPI({
        model: "claude-sonnet-4-6",
        system: "Retorne ESTRITAMENTE um objeto JSON válido. Obgigatoriamente escape as aspas duplas internas de valores usando barra invertida. Responda apenas com o JSON na estrutura da interface ResumeData fornecida e nada mais.",
        messages: [{ role: "user", content: contentParts }],
        temperature: 0.5,
        max_tokens: 4096
      });
  
      const textResponse = rawResult.content?.[0]?.text || "{}";
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
      const rawResult = await callAnthropicAPI({
          model: "claude-sonnet-4-6",
          system: "Retorne ESTRITAMENTE um objeto JSON válido. Obgigatoriamente escape as aspas duplas internas de valores usando barra invertida. Responda apenas com o JSON na estrutura da interface ResumeData fornecida e nada mais. Use a língua solicitada na instrução.",
          messages: [
            { role: "user", content: modelPrompt }
          ],
          temperature: 0.5,
          max_tokens: 4096
        });
      const parsedText = rawResult.content?.[0]?.text || "{}";
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
