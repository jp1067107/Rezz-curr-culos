import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello! Testing Gemini 2.5 flash."
      });
      console.log(response.text);
  } catch (e) {
      console.error(e);
  }
}
main();
