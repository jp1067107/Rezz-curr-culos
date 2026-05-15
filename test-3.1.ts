import {GoogleGenAI} from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  console.log("Using key:", apiKey);
  const ai = new GoogleGenAI({ apiKey });
  try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts: [{ text: "Hello" }] }
      });
      console.log(response.text);
  } catch (e: any) {
      console.error(e.message);
  }
}
main();
