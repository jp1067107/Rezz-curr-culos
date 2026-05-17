import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
      config: {
        systemInstruction: "You are a helpful assistant.",
        temperature: 0.1
      }
    });
    console.log(res.text);
  } catch (e: any) {
    console.log("Error:", e.message || e);
  }
}
run();
