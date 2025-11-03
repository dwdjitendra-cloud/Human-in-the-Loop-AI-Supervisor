import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorMiddleware } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import { startTimeoutHandler } from './services/timeoutHandler.js';
import { aiAgent } from './services/aiAgent.js';
import * as livekitAgent from './services/livekitAgent.js';

import helpRequestsRouter from './routes/helpRequests.js';
import knowledgeBaseRouter from './routes/knowledgeBase.js';
import supervisorsRouter from './routes/supervisors.js';
import webhookRouter from './routes/webhook.js';

dotenv.config();

import multer from 'multer';
import { textToSpeech } from './services/textToSpeech.js';
import { transcribeAudio, chatReceptionist } from './services/openaiService.js';
import jwt from 'jsonwebtoken';
const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow all by default; in production you can set CORS_ORIGIN to a comma-separated list
// Supports wildcard patterns like https://*.vercel.app
// Example: CORS_ORIGIN="https://reception-ai-inky.vercel.app,https://*.vercel.app"
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function originMatches(origin, pattern) {
  if (pattern === '*') return true;
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*') + '$');
    return regex.test(origin);
  }
  return origin === pattern;
}

if (corsOrigins.length > 0) {
  app.use(cors({
    origin: (origin, callback) => {
      // allow non-browser or same-origin requests
      if (!origin) return callback(null, true);
      const allowed = corsOrigins.some(p => originMatches(origin, p));
      callback(null, allowed);
    },
    credentials: true,
  }));
} else {
  app.use(cors());
}
app.use(express.json());

connectDB();

app.use('/api/help-requests', helpRequestsRouter);
app.use('/api/knowledge-base', knowledgeBaseRouter);
app.use('/api/supervisors', supervisorsRouter);
app.use('/api/webhook', webhookRouter);

app.post('/api/simulate-call', express.json(), async (req, res) => {
  const { customerName, question } = req.body;

  if (!customerName || !question) {
    return res.status(400).json({
      success: false,
      message: 'Customer name and question are required',
    });
  }

  const result = await aiAgent.processCall(customerName, question);

  res.json({
    success: true,
    data: result,
  });
});

// LiveKit token
app.post('/api/livekit/token', async (req, res) => {
  try {
    const { identity, roomName } = req.body || {};
    logger.info(`[LIVEKIT TOKEN][POST] identity=${identity} room=${roomName}`);
    if (!identity || !roomName) {
      return res.status(400).json({ success: false, message: 'identity and roomName are required' });
    }
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit keys not configured' });
    }
    // Build a LiveKit-compatible JWT using jsonwebtoken
    const payload = {
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      },
    };
    const token = jwt.sign(payload, apiSecret, {
      issuer: apiKey,
      subject: identity,
      expiresIn: '1h',
    });
    return res.json({ success: true, token });
  } catch (err) {
    logger.error(`[LIVEKIT TOKEN][POST] error: ${err.message}`);
    return res.status(500).json({ success: false, message: err.message || 'token failed' });
  }
});

// Token (GET) for quick checks
app.get('/api/livekit/token', async (req, res) => {
  try {
    const identity = (req.query.identity || '').toString();
    const roomName = (req.query.roomName || '').toString();
    logger.info(`[LIVEKIT TOKEN][GET] identity=${identity} room=${roomName}`);
    if (!identity || !roomName) {
      return res.status(400).json({ success: false, message: 'identity and roomName are required' });
    }
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit keys not configured' });
    }
    const payload = { video: { room: roomName, roomJoin: true, canPublish: true, canSubscribe: true } };
    const token = jwt.sign(payload, apiSecret, { issuer: apiKey, subject: identity, expiresIn: '1h' });
    return res.json({ success: true, token });
  } catch (err) {
    logger.error(`[LIVEKIT TOKEN][GET] error: ${err.message}`);
    return res.status(500).json({ success: false, message: err.message || 'token failed' });
  }
});

// TTS test
app.get('/api/voice/tts', async (req, res) => {
  try {
    const text = (req.query.text || '').toString();
    if (!text) {
      return res.status(400).json({ success: false, message: 'Missing text query parameter' });
    }
    const { buffer, mime } = await textToSpeech(text);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'TTS failed' });
  }
});

// Voice reply (text + audio)
app.post('/api/voice/reply', async (req, res) => {
  try {
    const { customerName, question } = req.body || {};
    if (!customerName || !question) {
      return res.status(400).json({ success: false, message: 'Customer name and question are required' });
    }
    const result = await aiAgent.processCall(customerName, question);

    // If we have a response string, synthesize audio for it
    let audioBase64 = null;
    let mime = null;
    if (result && result.response) {
      const tts = await textToSpeech(result.response);
      audioBase64 = tts.buffer.toString('base64');
      mime = tts.mime;
    }

    return res.json({ success: true, data: { ...result, audioBase64, mime } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Voice reply failed' });
  }
});

// STT → reply → TTS
const upload = multer();
app.post('/api/voice/stt-respond', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      const ct = req.headers['content-type'] || '';
      logger.warn(`[STT-RESPOND] Missing file. content-type=${ct}`);
      return res.status(400).json({ success: false, message: 'audio file required (multipart/form-data, field: audio). Ensure the request uses FormData and does not force Content-Type.' });
    }

  let transcript = '';
  let answer = '';

    // STT
    try {
      transcript = await transcribeAudio(file.buffer, file.originalname || 'audio.webm');
    } catch (sttErr) {
      logger.warn(`[STT-RESPOND] STT failed, falling back. reason=${sttErr.message}`);
      transcript = '';
    }

    // Agent
    let agentUsed = false;
    if (transcript && transcript.trim().length > 0) {
      try {
        const agentResult = await aiAgent.processCall('Caller', transcript.trim());
        if (agentResult && agentResult.success && agentResult.response) {
          answer = agentResult.response;
          agentUsed = true;
        }
      } catch (agentErr) {
        logger.warn(`[STT-RESPOND] aiAgent failed, will try Chat. reason=${agentErr.message}`);
      }
    }

    // Chat fallback
    if (!agentUsed) {
      try {
        const inputText = transcript && transcript.trim().length > 0 ? transcript : 'Caller spoke, content unavailable.';
        answer = await chatReceptionist(inputText);
      } catch (chatErr) {
        logger.warn(`[STT-RESPOND] Chat failed, using default answer. reason=${chatErr.message}`);
        answer = "Let me check with my supervisor and get back to you.";
      }
    }

  // TTS
  const preferredVoice = (req.body && req.body.voice) ? String(req.body.voice) : undefined;
  const tts = await textToSpeech(answer, preferredVoice);
    const audioBase64 = tts.buffer.toString('base64');
    return res.json({ success: true, data: { transcript, answer, audioBase64, mime: tts.mime } });
  } catch (err) {
    logger.error(`[STT-RESPOND] Unexpected error: ${err.message}`);
    return res.status(500).json({ success: false, message: err.message || 'stt-respond failed' });
  }
});

// LiveKit-style simulation
app.post('/api/livekit/simulate-call', async (req, res) => {
  try {
    const { customerName, question } = req.body || {};
    if (!customerName || !question) {
      return res.status(400).json({ success: false, message: 'Customer name and question are required' });
    }
    const reply = await livekitAgent.receiveCall(customerName, question);
    // If livekitAgent produced audio via its internal TTS, include it; otherwise synthesize here
    let audioBase64 = null;
    let mime = null;
    if (reply && reply.answer) {
      if (reply.audio) {
        audioBase64 = reply.audio.toString('base64');
        mime = 'audio/mpeg'; // best-effort; livekitAgent may return different types
      } else {
        const tts = await textToSpeech(reply.answer);
        audioBase64 = tts.buffer.toString('base64');
        mime = tts.mime;
      }
    }
    return res.json({ success: true, data: { ...reply, audioBase64, mime } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'LiveKit simulation failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorMiddleware);

startTimeoutHandler();

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
