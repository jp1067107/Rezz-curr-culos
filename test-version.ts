import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Return an empty JSON object: {}",
      config: {
        temperature: 0.1
      }
    } as any);
    console.log("RESPONSE KEYS:", Object.keys(res));
    console.log("RESPONSE TEXT:", res.text);
    if (!res.text) {
      console.log("RESPONSE TEXT IS UNDEFINED");
    }
  } catch (e: any) {
    console.log("ERROR:", e.message || e);
  }
}
run();
