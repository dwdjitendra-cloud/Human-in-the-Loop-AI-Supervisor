import dotenv from 'dotenv';
dotenv.config();

// Ensure fetch and FormData are available (Node < 18 support)
async function ensureFetch() {
  if (typeof fetch === 'undefined') {
    const { default: fetchImpl } = await import('node-fetch');
    globalThis.fetch = fetchImpl;
  }
  if (typeof FormData === 'undefined') {
    const { FormData: FormDataImpl, File: FileImpl, Blob: BlobImpl } = await import('node-fetch');
    globalThis.FormData = FormDataImpl;
    if (!globalThis.File) globalThis.File = FileImpl;
    if (!globalThis.Blob) globalThis.Blob = BlobImpl;
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = 'https://api.openai.com/v1';

export const SYSTEM_PROMPT = "You are a real-time voice AI receptionist for a salon called 'Frontdesk Salon'. You speak to customers over the phone using natural, friendly, and short voice responses. Your goals: 1) Greet callers politely and assist them with services, timings, or appointments. 2) If you confidently know an answer, respond in a conversational, human tone (under 20 words). 3) If you are not sure or lack information, say exactly: 'Let me check with my supervisor and get back to you.' Do not guess. 4) Once your supervisor provides the correct answer, repeat it naturally and save it into your knowledge base. 5) Maintain context across calls and learn incrementally. 6) Never mention AI, APIs, or system internals. 7) Keep responses clear and suitable for TTS (no long paragraphs).";

export async function transcribeAudio(buffer, filename = 'audio.webm') {
  await ensureFetch();
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const form = new FormData();
  const blob = new Blob([buffer]);
  form.append('file', blob, filename);
  form.append('model', 'whisper-1');
  form.append('response_format', 'json');

  const resp = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!resp.ok) {
    const msg = await safeText(resp);
    throw new Error(`Transcription failed (${resp.status}): ${msg}`);
  }
  const data = await resp.json();
  return data.text || '';
}

export async function chatReceptionist(userText) {
  await ensureFetch();
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userText }
    ],
    temperature: 0.3,
  };
  const resp = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const msg = await safeText(resp);
    throw new Error(`Chat failed (${resp.status}): ${msg}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  // Enforce the 20-word style lightly here
  return content.trim();
}

async function safeText(resp) {
  try { return await resp.text(); } catch { return '<no-body>'; }
}
