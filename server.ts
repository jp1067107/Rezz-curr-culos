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
    let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    try {
      const { model, contents, config } = req.body;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(500).json({ 
          error: "A chave de API configurada no painel de Secrets (GEMINI_API_KEY) está vazia ou incorreta. Vá em 'Settings > Secrets', clique na variável GEMINI_API_KEY e selecione uma chave válida na lista. Se precisar, acesse https://aistudio.google.com/app/apikey para criar uma nova chave." 
        });
      }

      console.log("Using API key in route:", apiKey);
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: model || "gemini-3.1-pro-preview",
        contents,
        config
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      let errorMsg = e.message;
      if (typeof errorMsg === 'string' && (errorMsg.includes("API key not valid") || errorMsg.includes("expired") || errorMsg.includes("API_KEY_INVALID"))) {
         errorMsg = "A chave do Gemini (GEMINI_API_KEY) nos Secrets expirou ou é inválida. Vá em 'Settings > Secrets', clique em GEMINI_API_KEY e selecione uma chave válida na lista suspensa (se precisar crie uma em https://aistudio.google.com/app/apikey).";
      } else if (typeof errorMsg === 'string' && errorMsg.includes("Quota exceeded")) {
         errorMsg = "O limite de uso gratuito da sua chave Gemini foi excedido (Quota Exceeded). Por favor aguarde um tempo ou utilize outra chave em 'Settings > Secrets'.";
      }
      res.status(500).json({ error: errorMsg });
    }
  });

  app.post("/api/groq", async (req, res) => {
    try {
      const { messages, model, temperature, max_tokens, response_format } = req.body;
      const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

      if (!apiKey || apiKey === "MY_GROQ_API_KEY" || apiKey.trim() === "") {
        return res.status(500).json({ error: "A chave da API Groq não está configurada corretamente. Como não é possível excluí-la pela interface, gere uma chave gratuita em https://console.groq.com/keys e cole no valor de GROQ_API_KEY no painel de Secrets." });
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
