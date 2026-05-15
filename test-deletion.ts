import {GoogleGenAI} from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  // simulate the environment where the user explicitly set MY_GEMINI_API_KEY
  // but we want to ignore it and fallback to the system one
  // WAIT, how did npx tsx -e get AIza... earlier?
  // Because 'npx tsx -e' might NOT have dotenv.config() loaded which overrides it?
  // Let's print it here!
  console.log("Original process.env.GEMINI_API_KEY =", process.env.GEMINI_API_KEY);
  
  delete process.env.GEMINI_API_KEY;
  console.log("After delete:", process.env.GEMINI_API_KEY);

  const ai = new GoogleGenAI();
  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: "Hello" }] },
      });
      console.log(response.text);
  } catch (e: any) {
      console.error(e.message);
  }
}

main();
