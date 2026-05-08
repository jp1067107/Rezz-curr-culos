import Groq from "groq-sdk";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  const groq = new Groq({ apiKey });
  
  try {
      const response = await groq.chat.completions.create({
          model: "llama-3.2-90b-vision-preview",
          messages: [
              {
                  role: "user",
                  content: [
                      { type: "text", text: "What's in this image?" },
                      { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=" } }
                  ]
              }
          ],
          temperature: 0.5,
          max_tokens: 100
      });
      console.log("SUCCESS:", response.choices[0].message.content);
  } catch (e) {
      console.error(e);
  }
}
main();
