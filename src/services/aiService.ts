import { ResumeData } from "../types";
import { v4 as uuidv4 } from "uuid";
import Groq from "groq-sdk";
import * as pdfjsLib from "pdfjs-dist/build/pdf.min.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("A chave da API Groq (GROQ_API_KEY) não foi encontrada ou está vazia. Adicione-a no painel de Segredos (Secrets).");
    }
    groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqClient;
}


function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
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
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64String = compressedDataUrl.split(',')[1];
          resolve(base64String);
        } else {
          resolve(result.split(',')[1]);
        }
      };
      img.onerror = () => {
        resolve(result.split(',')[1]);
      };
    };
    reader.onerror = (error) => reject(error);
  });
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
Seu trabalho é organizar as informações em um formato JSON, focado em ALTA LEGIBILIDADE.
NUNCA crie blocos de texto gigantes. O texto deve ser conciso e equilibrado.

REGRAS DE CONTEÚDO E FORMATAÇÃO (CRÍTICAS):
1. Perfil Profissional: Texto DIRETO E SUCINTO (máximo de 3 frases curtas). Nada de parágrafos enormes.
2. Experiência: Transcreva as experiências usando marcadores (bullet points). Crie de 2 a 4 bullet points CURTOS por cargo. NUNCA crie blocos monolíticos de texto. USE A QUEBRA DE LINHA ("\\n") para separar cada ponto.
   Exemplo de "description":
   "- Liderou o projeto X reduzindo custos.
   - Otimizou o processo Y com eficácia.
   - Treinou novos funcionários."
3. Habilidades: Limite a no máximo 6-8 habilidades importantes, nomes curtos (ex: "Excel Avançado").
4. Fidelidade aos dados factuais: NUNCA altere ou invente Nomes de Instituições, Empresas ou Cargos. Transcreva com fidelidade. Sua liberdade está em MELHORAR as DESCRIÇÕES de atividades para deixá-las corporativas e persuasivas.
5. Seções Extras (Customizadas): Se o currículo possuir outras categorias (ex: Idiomas, Projetos, Publicações, Soft Skills, Certificações de TI), agrupe no campo "customSections", cada seção deve ter "name" (como 'Idiomas') e em 'items', coloque 'title' (o idioma/curso/projeto) e, se aplicável, 'description' (nível ou detalhe).
6. Omitir 'id' de arrays.

Preencha as informações necessárias com textos enxutos. Certifique-se de que o texto não transborde, mantendo harmonia em 1 página. Retorne em português perfeito.
Responda OBRIGATORIAMENTE com um JSON válido correspondente a este schema:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "summary": "" },
  "experience": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "courses": [{ "name": "", "institution": "" }],
  "skills": [{ "name": "" }],
  "customSections": [{
    "name": "Idiomas",
    "items": [{ "title": "Inglês", "subtitle": "Avançado", "description": "Comunicação e leitura técnica" }]
  }]
}`;

export async function extractResumeDataFromFiles(files: FileList | File[]): Promise<ResumeData> {
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
      allPdfText += `[Conteúdo do arquivo PDF ${file.name}]:\n${text}\n\n`;
    } else if (file.type.includes('image')) {
      hasImage = true;
      const base64Data = await fileToBase64(file);
      base64Images.push({ mimeType: file.type, data: base64Data });
    }
  }

  let modelToUse = "llama-3.3-70b-versatile";

  if (!hasImage) {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `Analise o(s) seguinte(s) texto(s) extraído(s) de currículo(s) ou perfil(is) e transforme-os no JSON solicitado. Você precisará consolidar as informações caso haja mais de um arquivo. Reescreva e otimize as informações ativamente com linguagem corporativa persuasiva e focada em resultados. Adicione verbos de ação:\n\n${allPdfText}`
      }
    ];

    const options: any = {
      model: modelToUse,
      messages: messages,
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    };

    try {
      const response = await getGroq().chat.completions.create(options);
      let parsedText = response.choices[0]?.message?.content || "{}";
      const rawData = parseJsonResponse(parsedText);
      return normalizeResponse(rawData);
    } catch (error: any) {
      console.error("Error generating resume from files:", error);
      throw new Error(`Falha ao ler os arquivos: ${error.message || 'Houve um erro na inteligência artificial ao extrair os dados.'}`);
    }
  } else {
    // Has images - use Gemini 
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Chave da API Gemini não encontrada. Adicione GEMINI_API_KEY nas configurações ou secrets.");
      }

      const parts: any[] = [
        { text: `${SYSTEM_PROMPT}\n\nAnalise as imagens e textos fornecidos (podem ser currículos, perfis do linkedin, certificados). Extraia e consolide as informações, mas não apenas transcreva. REESCREVA E OTIMIZE ativamente as informações utilizando uma linguagem corporativa profunda, persuasiva e orientada para resultados. Transforme o conteúdo consolidado no formato JSON estrito.${allPdfText ? ' Também considere o seguinte texto extraído de arquivos PDF fornecidos junto:\n\n' + allPdfText : ''}` }
      ];

      for (const img of base64Images) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro da Inteligência Artificial (${response.status}): ${errText}`);
      }

      const rawResult = await response.json();
      const textResponse = rawResult.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const rawData = parseJsonResponse(textResponse);
      return normalizeResponse(rawData);
    } catch (error: any) {
      console.error("Error reading mixed files with Gemini:", error);
      throw new Error(`Falha ao processar as imagens/arquivos: ${error.message}`);
    }
  }
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
Corrija erros gramaticais ou de ortografia (mantenha em português). Expanda descrições curtas usando bullet points para que pareçam conquistas profissionais. 
Use a quebra de linha ("\\n") para separar os bullet points na "description" da experiência.
Mantenha a estrutura JSON OBRIGATÓRIA. Não adicione texto fora do JSON.

Dados Atuais do Currículo:
${JSON.stringify(dataForAi, null, 2)}
`;

  const response = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: modelPrompt }
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const parsedText = response.choices[0]?.message?.content || "{}";
  const rawData = parseJsonResponse(parsedText);
  
  return {
    ...normalizeResponse(rawData),
    id: currentData.id,
    personalInfo: {
      ...normalizeResponse(rawData).personalInfo,
      photoUrl: currentData.personalInfo.photoUrl,
    }
  };
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
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: modelPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const parsedText = response.choices[0]?.message?.content || '{"keywords":[]}';
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
4. Caso a empresa não tenha sido informada, use espaços em branco como "[Nome da Empresa]".
5. Inicie com uma saudação formal.
6. A formatação deve ser um texto limpo, com 3 a 4 parágrafos, sem utilizar formatações markdown (sem **, sem #, etc.).

IMPORTANTE: Você deve retornar SOMENTE O TEXTO DA CARTA. Não adicione observações, conselhos, introdução ou conclusão para o usuário. Apenas a carta redigida.
`;

  const response = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "Você é um assistente gerador de cartas de apresentação baseadas em perfis profissionais. Responda única e exclusivamente com o conteúdo da carta final." },
      { role: "user", content: modelPrompt }
    ],
    temperature: 0.6,
  });

  return response.choices[0]?.message?.content || "";
}