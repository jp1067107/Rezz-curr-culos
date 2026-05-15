import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: "Hello" }] },
      config: {
        systemInstruction: "test",
        temperature: 0.5,
        responseMimeType: "application/json",
      }
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}

test();
