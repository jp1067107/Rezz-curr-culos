import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY missing");

const groq = new Groq({ apiKey });

async function test() {
  const response = await groq.chat.completions.create({
    model: "llama-3.2-90b-vision-preview", // no wait I'll use a shell command to just curl the models list
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Return the word 'hello' in JSON: {\"message\": \"hello\"}." },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=" } }
        ]
      }
    ],
    temperature: 0.5,
    max_tokens: 1024,
  });

  console.log(response.choices[0]?.message?.content);
}

test().catch(console.error);
