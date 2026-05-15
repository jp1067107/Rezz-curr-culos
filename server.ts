import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/gemini", async (req, res) => {
    try {
      const { allPdfText, base64Images, SYSTEM_PROMPT } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "A chave da API Gemini não está configurada corretamente. Por favor, adicione uma chave válida chamada GEMINI_API_KEY no painel de Secrets (Segredos)." });
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
        if (errText.includes("API_KEY_INVALID") || errText.includes("API key not valid")) {
           return res.status(400).json({ error: "A chave da API Gemini fornecida nos secrets é inválida. Por favor, acesse o menu Configurações/Secrets e atualize a variável GEMINI_API_KEY com uma chave válida, ou remova-a." });
        }
        return res.status(response.status).json({ error: errText });
      }

      const rawResult = await response.json();
      res.json(rawResult);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/groq", async (req, res) => {
    try {
      const { messages, model, temperature, max_tokens, response_format } = req.body;
      const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

      if (!apiKey || apiKey === "MY_GROQ_API_KEY") {
        return res.status(500).json({ error: "A chave da API Groq não está configurada corretamente. Por favor, adicione uma chave válida chamada GROQ_API_KEY no painel de Secrets (Segredos)." });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          messages,
          model,
          temperature,
          max_tokens,
          response_format
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (errText.includes("invalid_api_key") || errText.includes("AuthenticationError")) {
           return res.status(401).json({ error: "A chave da API Groq fornecida nos secrets é inválida. Por favor, acesse o menu Configurações/Secrets e atualize a variável GROQ_API_KEY com uma chave válida." });
        }
        return res.status(response.status).json({ error: errText });
      }

      const rawResult = await response.json();
      res.json(rawResult);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
