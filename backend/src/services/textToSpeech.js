// Server-side Text-to-Speech helper
// If OPENAI_API_KEY is provided, synthesize using OpenAI TTS (gpt-4o-mini-tts)
// Otherwise, fall back to generating a short WAV beep so you can still test the audio path.

import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_VOICE = process.env.TTS_VOICE || 'alloy';

export async function textToSpeech(text, voiceOverride) {
  // Ensure fetch is available (Node < 18 fallback)
  if (typeof fetch === 'undefined') {
    const { default: fetchImpl } = await import('node-fetch');
    globalThis.fetch = fetchImpl;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      // Use OpenAI REST API directly to avoid extra dependencies
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: String(voiceOverride || DEFAULT_VOICE),
          input: String(text || ''),
          format: 'mp3',
        }),
      });

      if (!resp.ok) {
        const msg = await safeReadText(resp);
        throw new Error(`OpenAI TTS failed (${resp.status}): ${msg}`);
      }
      const arrayBuf = await resp.arrayBuffer();
      return { buffer: Buffer.from(arrayBuf), mime: 'audio/mpeg' };
    } catch (err) {
      // Fall back to a beep so the app path still works
      return generateBeepWav();
    }
  }
  // No API key -> fallback
  return generateBeepWav();
}

async function safeReadText(resp) {
  try { return await resp.text(); } catch { return '<no-body>'; }
}

// Minimal WAV generator producing a 500ms sine beep so you can verify audio flow end-to-end.
function generateBeepWav(durationMs = 500, freq = 880, sampleRate = 22050) {
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const buffer = Buffer.alloc(44 + numSamples * 2); // 16-bit mono PCM

  // RIFF/WAVE header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Sine wave samples
  const amplitude = 30000;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.round(amplitude * Math.sin(2 * Math.PI * freq * t));
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  return { buffer, mime: 'audio/wav' };
}
