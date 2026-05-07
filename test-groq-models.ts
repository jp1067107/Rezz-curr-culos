import Groq from "groq-sdk";
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY missing");

const groq = new Groq({ apiKey });

async function test() {
  const models = await groq.models.list();
  console.log(models.data.map(m => m.id).join(', '));
}

test().catch(console.error);
