import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import fs from "fs";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    initializeApp();
  }
} catch (e) {
  console.log("Firebase admin initialization failed", e);
}

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

  // Cakto Webhook Endpoint
  app.post("/api/webhook/cakto", async (req, res) => {
    try {
      const data = req.body;
      console.log("Webhook Cakto recebido:", JSON.stringify(data, null, 2));

      // Cakto envia os dados do cliente e da transação. 
      // Dependendo da estrutura exata (vamos cobrir as mais comuns para o caso de aprovação):
      const email = data?.customer?.email || data?.data?.customer?.email;
      const status = data?.status || data?.data?.status;
      const event = data?.event;

      const isApproved = status === 'approved' || status === 'paid' || event === 'payment.approved' || event === 'transaction.approved';

      if (email && isApproved) {
         console.log(`Liberando acesso premium via Webhook para: ${email}`);
         try {
            const db = getFirestore();
            await db.collection('premium_accounts').doc(email).set({
               active: true,
               updatedAt: new Date().toISOString(),
               source: 'cakto_webhook'
            }, { merge: true });
            console.log(`Sucesso ao salvar premium para: ${email}`);
         } catch(dbErr) {
            console.error("Erro ao salvar no Firestore (você configurou o FIREBASE_SERVICE_ACCOUNT no painel?):", dbErr);
         }
         return res.status(200).json({ received: true });
      }

      return res.status(200).json({ received: true, ignored: true, message: "Não foi um evento de aprovação ou o e-mail não estava presente." });
    } catch(e) {
      console.error("Erro no webhook:", e);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/anthropic", async (req, res) => {
    try {
      const { model, system, messages, max_tokens, temperature } = req.body;
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey || apiKey.trim() === "") {
        return res.status(500).json({ error: "A chave da API Anthropic (ANTHROPIC_API_KEY) não está configurada." });
      }

      const modelsToTry = [
        model || "claude-sonnet-4-6",
        "claude-sonnet-4-6",
        "claude-opus-4-7",
        "claude-sonnet-4-6",
        "claude-sonnet-4-5-20250929",
        "claude-haiku-4-5-20251001",
        "claude-opus-4-5-20251101"
      ];

      // Remove duplicates
      const uniqueModels = Array.from(new Set(modelsToTry));

      let lastErrorResponse = null;
      let lastErrorStatus = 500;
      let successfulResponse = null;

      for (const currentModel of uniqueModels) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: currentModel,
            system,
            messages,
            temperature: temperature || 0,
            max_tokens: max_tokens || 4096
          })
        });

        if (response.ok) {
          successfulResponse = await response.json();
          break; // Success!
        } else {
          lastErrorStatus = response.status;
          const errText = await response.text();
          lastErrorResponse = errText;
          
          let isNotFoundError = false;
          try {
             const parsedErr = JSON.parse(errText);
             if (parsedErr?.error?.type === "not_found_error") {
                isNotFoundError = true;
             }
          } catch (e) {
             // Ignore parse error
          }

          // If the model was not found, we continue to the next one
          if (response.status === 404 || isNotFoundError) {
             console.warn(`[Anthropic] Model ${currentModel} failed with 404, trying next...`);
             continue; 
          }
          
          // Overloaded API (wait and retry once if we only tried 1 or 2 models? Let's just break on other errors)
          if (response.status !== 429 && response.status !== 503 && response.status !== 529) {
             break; // Stop and return this error (e.g. 401 unauthorized, or 400 bad request)
          } else {
             // Rate limit or overloaded, backoff minimally before continuing
             await new Promise(r => setTimeout(r, 1500));
          }
        }
      }

      if (successfulResponse) {
        return res.json(successfulResponse);
      } else {
        return res.status(lastErrorStatus).json({ error: lastErrorResponse || "Unknown error" });
      }
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
