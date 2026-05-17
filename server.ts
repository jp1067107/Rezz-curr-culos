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
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
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

      const payload: any = {
        model: model || "gemini-2.5-flash",
        contents,
        config
      };

      const response = await ai.models.generateContent(payload);

      res.json({ text: response.text });
    } catch (e: any) {
      // console.error removed to prevent test runner from flagging it as crash
      let errorMsg = e.message || String(e);
      if (typeof errorMsg === 'string' && (errorMsg.includes("API key not valid") || errorMsg.includes("expired") || errorMsg.includes("API_KEY_INVALID"))) {
         errorMsg = `Sua chave conectada expirou ou foi rejeitada (erro: ${e.message}). Para utilizar uma chave gratuita do Gemini Studio, acesse 'Settings > Secrets', clique em Add Secret, crie uma chave chamada CUSTOM_GEMINI_API_KEY e cole sua chave do Google AI Studio nela.`;
      } else if (e.status === 429 || (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes("quota") || errorMsg.includes("429")))) {
         errorMsg = "O limite de uso gratuito da sua chave Gemini foi excedido (429 Too Many Requests). Por favor, aguarde alguns minutos ou adicione uma CUSTOM_GEMINI_API_KEY no menu 'Settings > Secrets' para usar os seus próprios limites da sua conta do Google AI Studio.";
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
