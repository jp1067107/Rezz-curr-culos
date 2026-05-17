import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function main() {
  try {
    const res = await ai.models.generateContent({ model: "gemini-1.5-flash", contents: "Say hi" });
    console.log(res.text);
  } catch(e) {
    console.log(e);
  }
}
main();
