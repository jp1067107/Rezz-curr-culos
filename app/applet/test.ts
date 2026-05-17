import { GoogleGenAI } from "@google/genai";

const k1 = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY exists?", !!k1, k1?.substring(0, 10));

if (k1) {
  const ai = new GoogleGenAI({ apiKey: k1 });
  try {
     const r = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Say hi" });
     console.log("k1 success", r.text);
  } catch(e) {
     console.log("k1 error", e.message);
  }
}

const k2 = process.env.VITE_GEMINI_API_KEY;
console.log("VITE_GEMINI_API_KEY exists?", !!k2, k2?.substring(0, 10));

if (k2) {
  const ai = new GoogleGenAI({ apiKey: k2 });
  try {
     const r = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Say hi" });
     console.log("k2 success", r.text);
  } catch(e) {
     console.log("k2 error", e.message);
  }
}

const k3 = process.env.CUSTOM_GEMINI_API_KEY;
console.log("CUSTOM_GEMINI_API_KEY exists?", !!k3, k3?.substring(0, 10));

if (k3) {
  const ai = new GoogleGenAI({ apiKey: k3 });
  try {
     const r = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Say hi" });
     console.log("k3 success", r.text);
  } catch(e) {
     console.log("k3 error", e.message);
  }
}
