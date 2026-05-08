import Groq from "groq-sdk";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const models = await groq.models.list();
  console.log(models.data.map((m: any) => m.id).join(', '));
}
main();
