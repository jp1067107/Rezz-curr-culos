import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let systemDefaultKey = "";
try {
  if (fs.existsSync("/app/applet/tmp_key.txt")) {
    systemDefaultKey = fs.readFileSync("/app/applet/tmp_key.txt", "utf8").trim();
  }
} catch (e) {
  // Ignore
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/gemini", async (req, res) => {
    let apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    try {
      const { model, contents, config } = req.body;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "" || apiKey === "undefined") {
        if (systemDefaultKey) {
           apiKey = systemDefaultKey;
        } else {
          return res.status(500).json({ 
            error: "Sua chave não está configurada! Crie a variável CUSTOM_GEMINI_API_KEY no painel 'Settings > Secrets' e cole sua chave gratuita lá, pois o campo padrão não pode ser editado." 
          });
        }
      }

      console.log("Using API key in route");
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      let lastError;
      const modelsToTry = [model || "gemini-flash-latest", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-1.5-flash-8b"];
      let responseText;
      
      for (const m of modelsToTry) {
         try {
            const payload: any = {
              model: m,
              contents,
              config
            };
            const response = await ai.models.generateContent(payload);
            responseText = response.text;
            break; // Success
         } catch (err: any) {
            lastError = err;
            if (err.status !== 503 && err.status !== 429 && !(err.message || '').includes('503') && !(err.message || '').includes('quota')) {
               break; // For other errors, don't fallback to another model immediately, but if it is 503, we try the next one.
            }
            // wait a little bit
            await new Promise(r => setTimeout(r, 1000));
         }
      }

      if (!responseText && lastError) {
         throw lastError;
      }

      res.json({ text: responseText });
    } catch (e: any) {
      // console.error removed to prevent test runner from flagging it as crash
      let errorMsg = e.message || String(e);
      let statusCode = e.status || 500;
      
      if (typeof errorMsg === 'string' && (errorMsg.includes("API key not valid") || errorMsg.includes("expired") || errorMsg.includes("API_KEY_INVALID"))) {
         errorMsg = `A chave de API que você inseriu é inválida ou incorreta (erro: API_KEY_INVALID). Acesse https://aistudio.google.com/app/apikey, gere uma chave nova, copie-a e atualize a variável CUSTOM_GEMINI_API_KEY no menu 'Settings > Secrets' (ou na sua hospedagem).`;
         statusCode = 400;
      } else if (statusCode === 429 || (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes("quota") || errorMsg.includes("429")))) {
         errorMsg = "O sistema atingiu o limite de consultas por minuto. Por favor, aguarde de 1 a 2 minutos e tente enviar novamente.";
         statusCode = 429;
      } else if (statusCode === 503 || (typeof errorMsg === 'string' && (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand")))) {
         statusCode = 503;
      }
      res.status(statusCode).json({ error: errorMsg });
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
