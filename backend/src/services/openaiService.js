import dotenv from 'dotenv';
dotenv.config();

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

export const SYSTEM_PROMPT = "You are a real-time voice receptionist for 'Frontdesk Salon'. Keep responses friendly, short (under 20 words), and avoid guessing. If unsure, say: 'Let me check with my supervisor and get back to you.'";

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
