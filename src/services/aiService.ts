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
4. Criatividade e Expansão: Se as descrições ou informações do usuário forem muito curtas, genéricas ou vagas, VOCÊ TEM TOTAL PERMISSÃO PARA INVENTAR e INFERIR dados lógicos (experiências adicionais compatíveis com a área, habilidades esperadas ou descrições ricas) para tornar o currículo mais forte e completo.
5. Omitir 'id' de arrays.

Preencha as informações necessárias com textos enxutos. Certifique-se de que o texto não transborde, mantendo harmonia em 1 página. Retorne em português perfeito.
Responda OBRIGATORIAMENTE com um JSON válido correspondente a este schema:
{
  "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "summary": "" },
  "experience": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "" }],
  "skills": [{ "name": "" }]
}`;

export async function extractResumeDataFromFile(file: File): Promise<ResumeData> {
  const mimeType = file.type;
  if (!mimeType.includes('pdf') && !mimeType.includes('image')) {
    throw new Error('Please upload a PDF or an image file.');
  }

  let messages: any[] = [];
  let modelToUse = "llama-3.3-70b-versatile";

  if (mimeType.includes('pdf')) {
    const text = await extractTextFromPdf(file);
    messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `Analise o seguinte texto extraído de um currículo e transforme-o no JSON solicitado. Reescreva e otimize as informações ativamente com linguagem corporativa persuasiva e focada em resultados. Adicione verbos de ação:\n\n${text}`
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
      console.error("Error generating resume from file:", error);
      throw new Error(`Falha ao ler o arquivo: ${error.message || 'Houve um erro na inteligência artificial ao extrair os dados.'}`);
    }
  } else {
    // It's an image - Groq model is deprecated, use Gemini instead
    try {
      const base64Data = await fileToBase64(file);
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Chave da API Gemini não encontrada. Adicione GEMINI_API_KEY nas configurações ou secrets.");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${SYSTEM_PROMPT}\n\nAnalise a imagem de currículo fornecida. Extraia as informações, mas não apenas transcreva. REESCREVA E OTIMIZE ativamente as informações utilizando uma linguagem corporativa profunda, persuasiva e orientada para resultados. Transforme o conteúdo no formato JSON estrito.` },
                { inlineData: { mimeType: "image/jpeg", data: base64Data } }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json"
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
      console.error("Error reading image with Gemini:", error);
      throw new Error(`Falha ao processar a imagem: ${error.message}`);
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
    skills: Array.isArray(rawData.skills) ? rawData.skills.map((skill: any) => ({
      id: uuidv4(),
      name: skill.name || '',
    })) : [],
  };
}

export async function generateResumeDataFromPrompt(prompt: string, currentData: ResumeData): Promise<ResumeData> {
  const dataForAi = {
    ...currentData,
    personalInfo: {
      ...currentData.personalInfo,
      photoUrl: undefined, 
    }
  };
  const currentDataString = JSON.stringify(dataForAi, null, 2);
  
  const response = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Os dados atuais do currículo do usuário são:\n${currentDataString}\n\nO usuário pediu:\n"${prompt}"\n\nAtualize as informações do currículo com base no pedido do usuário e retorne TODO o currículo de volta (partes modificadas e partes não modificadas) em JSON.\n\nCRÍTICO: Você não deve apenas transcrever ou inserir os dados crus. Você deve REESCREVER E APRIMORAR o conteúdo como um especialista. Aprimore o perfil e a experiência usando formato de bullet points concisos e focados em resultados.` }
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const parsedText = response.choices[0]?.message?.content || "{}";
  const rawData = parseJsonResponse(parsedText);

  const normalizedData: ResumeData = {
    personalInfo: {
      fullName: rawData.personalInfo?.fullName || currentData.personalInfo.fullName,
      jobTitle: rawData.personalInfo?.jobTitle || currentData.personalInfo.jobTitle,
      email: rawData.personalInfo?.email || currentData.personalInfo.email,
      phone: rawData.personalInfo?.phone || currentData.personalInfo.phone,
      location: rawData.personalInfo?.location || currentData.personalInfo.location,
      summary: rawData.personalInfo?.summary || currentData.personalInfo.summary,
      photoUrl: currentData.personalInfo.photoUrl,
    },
    experience: Array.isArray(rawData.experience) ? rawData.experience.map((exp: any) => ({
      id: uuidv4(),
      company: exp.company || '',
      position: exp.position || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
    })) : currentData.experience,
    education: Array.isArray(rawData.education) ? rawData.education.map((edu: any) => ({
      id: uuidv4(),
      institution: edu.institution || '',
      degree: edu.degree || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
    })) : currentData.education,
    skills: Array.isArray(rawData.skills) ? rawData.skills.map((skill: any) => ({
      id: uuidv4(),
      name: skill.name || '',
    })) : currentData.skills,
  };

  return normalizedData;
}

export async function generateCoverLetter(resumeData: ResumeData, targetJob: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave da API Gemini não encontrada. Adicione GEMINI_API_KEY nas configurações ou secrets.");
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `Aja como um redator profissional especializado em carreira e recursos humanos. Use as informações do currículo abaixo para criar uma Carta de Apresentação (Cover Letter) focada na seguinte vaga ou cargo alvo: "${targetJob}".
          
Regras:
1. Comece com uma saudação profissional.
2. Destaque as experiências e habilidades essenciais do currículo que tenham sinergia com o cargo alvo.
3. Mantenha um tom profissional, entusiasmado e persuasivo.
4. Finalize com um chamado para ação (call to action) para uma entrevista ou conversa.
5. Seja direto, a carta deve ter entre 3 a 4 parágrafos.
6. A formatação deve ser um texto limpo, sem markdown (sem ** para negrito ou # para títulos), formatado para ser copiado e colado em um corpo de e-mail ou documento.
7. Substitua informações sensíveis por colchetes, caso faltem detalhes para enviar a carta, por exemplo: [Nome da Empresa].

Dados do Currículo:
${JSON.stringify(resumeData, null, 2)}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro ao gerar a carta (${response.status}): ${errText}`);
  }

  const rawResult = await response.json();
  return rawResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
