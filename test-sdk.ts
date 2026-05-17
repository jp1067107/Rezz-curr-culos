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
    } as any);
    console.log("SUCCESS WITH CONFIG:", res.text);
  } catch (e: any) {
    console.log("ERROR WITH CONFIG:", e.message || e);
  }

  try {
    const res2 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
      systemInstruction: "You are a helpful assistant.",
      config: {
        temperature: 0.1
      }
    } as any);
    console.log("SUCCESS WITH ROOT:", res2.text);
  } catch (e: any) {
    console.log("ERROR WITH ROOT:", e.message || e);
  }
}
run();
