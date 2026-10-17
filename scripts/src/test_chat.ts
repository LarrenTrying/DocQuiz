process.env.PORT = "5057";

interface ChatApiResponse {
  reply?: string;
  answer?: string;
  hasImage?: boolean;
  error?: string;
}

const PORT = 5057;
const API_URL = `http://127.0.0.1:${PORT}`;

export {};

async function runChatTests() {
  // @ts-ignore - compiled dist artifact doesn't emit declaration files
  await import("../../artifacts/api-server/dist/index.mjs");
  await new Promise((r) => setTimeout(r, 400));

  console.log(`--- Testing /api/chat/ask Endpoint on port ${PORT} ---`);

  // Test 1: Text-only question
  const textRes = await fetch(`${API_URL}/api/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'What is photosynthesis?',
    }),
  });
  const textData = (await textRes.json()) as ChatApiResponse;
  console.log('Test 1 (Text-only): status =', textRes.status);
  console.log('Response excerpt:', textData.reply ? textData.reply.substring(0, 100) + '...' : textData);
  if (!textData.reply) throw new Error('Missing reply for text-only request');

  // Test 2: Image + Prompt
  const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imgRes = await fetch(`${API_URL}/api/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: sampleImage,
      prompt: 'Solve this math equation and explain step by step.',
    }),
  });
  const imgData = (await imgRes.json()) as ChatApiResponse;
  console.log('Test 2 (Image + Prompt): status =', imgRes.status);
  console.log('Response excerpt:', imgData.reply ? imgData.reply.substring(0, 100) + '...' : imgData);
  if (!imgData.reply) throw new Error('Missing reply for image request');

  // Test 3: Image Only (no prompt)
  const imgOnlyRes = await fetch(`${API_URL}/api/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: sampleImage,
    }),
  });
  const imgOnlyData = (await imgOnlyRes.json()) as ChatApiResponse;
  console.log('Test 3 (Image Only): status =', imgOnlyRes.status);
  console.log('Response excerpt:', imgOnlyData.reply ? imgOnlyData.reply.substring(0, 100) + '...' : imgOnlyData);
  if (!imgOnlyData.reply) throw new Error('Missing reply for image-only request');

  console.log('All chat API tests completed successfully!');
  process.exit(0);
}

runChatTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
