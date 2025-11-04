import React, { useEffect, useRef, useState } from 'react';
import { voiceAPI, aiAgentAPI } from '../services/api';
import * as LK from 'livekit-client';

export const LiveVoice = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [identity, setIdentity] = useState('guest-' + Math.floor(Math.random() * 10000));
  const [roomName, setRoomName] = useState('salon-room');
  const [enableLoop, setEnableLoop] = useState(false);
  const [useBrowserFallback, setUseBrowserFallback] = useState(false);
  const [selectedServerVoice, setSelectedServerVoice] = useState('verse');
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState('');
  const [availableBrowserVoices, setAvailableBrowserVoices] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [micLevel, setMicLevel] = useState(0);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastAnswer, setLastAnswer] = useState('');
  const roomRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const recorderRef = useRef(null);
  const busyRef = useRef(false);
  const recognitionRef = useRef(null);
  const playbackRef = useRef(null);
  const playQueueRef = useRef([]);
  const serverFailCountRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const probeIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const currentLevelRef = useRef(0); // live mic level for simple VAD
  const lastSentRef = useRef(0);     // last time an audio chunk was sent
  const vadThresholdRef = useRef(10); // gate threshold on 0-100 scale
  const lastVoiceActivityRef = useRef(0); // last time level crossed threshold
  const warmupUntilRef = useRef(0); // grace period to ignore degradation at start
  const lastHintAtRef = useRef(0); // throttle hint popup
  const [hint, setHint] = useState('');
  const [showTypeBox, setShowTypeBox] = useState(false);
  const [typedQuestion, setTypedQuestion] = useState('');

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

  const join = async () => {
    setError('');
    if (!LIVEKIT_URL) {
      setError('Missing VITE_LIVEKIT_URL in frontend config');
      return;
    }
    try {
      setStatus('requesting-token');
      const tokResp = await voiceAPI.token({ identity, roomName });
      const token = tokResp?.data?.token;
      if (!token) throw new Error('No token returned');

      setStatus('connecting');
      const room = new LK.Room();
      await room.connect(LIVEKIT_URL, token);

      const tracks = await LK.createLocalTracks({ audio: true, video: false });
      const audioTrack = tracks.find(t => t.kind === 'audio') || tracks[0];
      localAudioTrackRef.current = audioTrack || null;
      for (const t of tracks) {
        await room.localParticipant.publishTrack(t);
      }

      roomRef.current = room;
      setStatus('connected');

      const refreshParticipants = () => {
        try {
          const rm = roomRef.current || room;
          if (!rm) { setParticipants([]); return; }
          const locals = rm.localParticipant?.identity ? [rm.localParticipant.identity] : [];
          const map = rm.participants;
          const remotes = (map && typeof map.values === 'function')
            ? Array.from(map.values()).map(p => p?.identity).filter(Boolean)
            : [];
          setParticipants([...locals, ...remotes]);
        } catch {
          setParticipants([]);
        }
      };
      refreshParticipants();
      room.on(LK.RoomEvent.ParticipantConnected, refreshParticipants);
      room.on(LK.RoomEvent.ParticipantDisconnected, refreshParticipants);

      try {
        startMicMeter(localAudioTrackRef.current);
      } catch {}

      room.on(LK.RoomEvent.Disconnected, () => {
        setStatus('disconnected');
        stopLoop();
        stopMicMeter();
        setParticipants([]);
      });

      if (enableLoop) startLoop();
    } catch (e) {
      setError(e.message || 'Failed to join');
      setStatus('idle');
    }
  };

  const leave = async () => {
    try {
      stopLoop();
      const room = roomRef.current;
      if (room) {
        // Stop local tracks; avoid unpublish to prevent renegotiation on a closing/closed PC
        try {
          room.localParticipant?.tracks?.forEach((pub) => {
            try { pub.track?.stop?.(); } catch {}
          });
        } catch {}
        try { await room.disconnect(); } catch {}
      }
      roomRef.current = null;
      setStatus('idle');
  setParticipants([]);
  stopMicMeter();
    } catch (e) {
      setError(e.message || 'Failed to leave');
    }
  };

  const startLoop = () => {
    try {
      if (useBrowserFallback) {
        startBrowserSTTLoop();
        startProbeTimer();
        return;
      }
      // reset degradation tracking and apply a short warmup period
      serverFailCountRef.current = 0;
      cooldownUntilRef.current = 0;
      warmupUntilRef.current = Date.now() + 6000; // 6s grace
      const localAudio = localAudioTrackRef.current;
      if (!localAudio || !localAudio.mediaStreamTrack) {
        setError('Mic track not ready. Join first.');
        return;
      }
      const stream = new MediaStream([localAudio.mediaStreamTrack]);
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64000 });
      rec.ondataavailable = async (e) => {
        if (!e.data || e.data.size < 2048) return;
        // Simple VAD gating to avoid sending silence; force periodic sends to keep context fresh
        const now = Date.now();
        const speaking = currentLevelRef.current >= vadThresholdRef.current;
        const stale = now - (lastSentRef.current || 0) > 2500; // ensure at least every 2.5s
        const spokeRecently = (now - (lastVoiceActivityRef.current || 0)) < 4000; // within last 4s
        if (!speaking && !(stale && spokeRecently)) return;
        if (busyRef.current) return;
        busyRef.current = true;
        try {
          const resp = await voiceAPI.sttRespond(e.data, selectedServerVoice);
          const payload = resp?.data?.data || {};
          if (payload.transcript) setLastTranscript(payload.transcript);
          // Only show agent answer if we actually captured a transcript (avoid auto-print on silence)
          if (payload.answer && payload.transcript && payload.transcript.trim() !== '') setLastAnswer(payload.answer);
          if (payload.audioBase64 && payload.mime) {
            enqueueTTS(payload.audioBase64, payload.mime);
          }
          lastSentRef.current = now;

          const fallbackPhrase = "Let me check with my supervisor and get back to you.";
          const isBeep = payload?.mime === 'audio/wav';
          const emptyTranscript = !payload?.transcript || payload.transcript.trim() === '';
          const isFallbackAnswer = (payload?.answer || '').trim() === fallbackPhrase;
          const degraded = (isBeep && emptyTranscript) || isFallbackAnswer;
          if (degraded) {
            // Ignore degradations during initial warmup window
            if (Date.now() >= warmupUntilRef.current) {
              serverFailCountRef.current += 1;
              // set cooldown for 45s on degradation (slightly shorter)
              cooldownUntilRef.current = Date.now() + 45_000;
              // Show a gentle hint to the user to repeat or type (throttled)
              if (emptyTranscript) {
                const now2 = Date.now();
                if (now2 - (lastHintAtRef.current || 0) > 15000) {
                  lastHintAtRef.current = now2;
                  showEphemeralHint("I didn't catch that — please repeat or type your question.");
                }
              }
            }
          } else {
            serverFailCountRef.current = 0;
          }

          if (!useBrowserFallback && serverFailCountRef.current >= 3) {
            setNotice('Server speech is rate-limited. Switched to browser STT/TTS temporarily.');
            setUseBrowserFallback(true);
            setTimeout(() => {
              stopLoop();
              if (status === 'connected' && enableLoop) startLoop();
            }, 80);
          }
        } catch (err) {
          console.error('stt-respond failed', err);
        } finally {
          setTimeout(() => { busyRef.current = false; }, 200);
        }
      };
      rec.start(600); // smaller chunks for lower latency
      recorderRef.current = rec;
    } catch (e) {
      setError(e.message || 'Failed to start loop');
    }
  };

  const stopLoop = () => {
    try {
      stopBrowserSTTLoop();
      stopProbeTimer();
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.stop();
      }
      recorderRef.current = null;
      playQueueRef.current = [];
      if (playbackRef.current) {
        try { playbackRef.current.pause(); } catch {}
        playbackRef.current.src = '';
      }
    } catch {}
  };

  const enqueueTTS = (audioBase64, mime) => {
    const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    playQueueRef.current.push(blob);
    pumpPlayback();
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result || '').toString().split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const pumpPlayback = () => {
    const audioEl = playbackRef.current || (playbackRef.current = new Audio());
    audioEl.playbackRate = 1.0;
    if ('preservesPitch' in audioEl) {
      try { audioEl.preservesPitch = true; } catch {}
    }
    if (!audioEl.paused || audioEl.currentTime > 0 && !audioEl.ended) {
      return;
    }
    const next = playQueueRef.current.shift();
    if (!next) return;
    const url = URL.createObjectURL(next);
    audioEl.src = url;
    audioEl.onended = () => {
      URL.revokeObjectURL(url);
      setTimeout(pumpPlayback, 120);
    };
    audioEl.onerror = () => {
      URL.revokeObjectURL(url);
      pumpPlayback();
    };
    audioEl.play().catch(() => pumpPlayback());
  };

  const startMicMeter = (audioTrack) => {
    stopMicMeter();
    if (!audioTrack || !audioTrack.mediaStreamTrack) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const stream = new MediaStream([audioTrack.mediaStreamTrack]);
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const level = Math.min(100, Math.max(0, Math.round(rms * 140)));
      setMicLevel(level);
      currentLevelRef.current = level;
      if (level >= vadThresholdRef.current) {
        lastVoiceActivityRef.current = Date.now();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopMicMeter = () => {
    if (rafRef.current) {
      try { cancelAnimationFrame(rafRef.current); } catch {}
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicLevel(0);
  };

  const showEphemeralHint = (message, ms = 4000) => {
    try {
      setHint(message);
      setShowTypeBox(false);
      setTimeout(() => { setHint(''); }, ms);
    } catch {}
  };

  const sendTypedQuestion = async () => {
    const q = (typedQuestion || '').trim();
    if (!q) return;
    try {
      setLastTranscript(q);
      const res = await voiceAPI.reply({ customerName: identity, question: q, voice: selectedServerVoice });
      const payload = res?.data?.data || {};
      const ans = payload?.response || payload?.answer || '';
      if (ans) setLastAnswer(ans);
      if (payload?.audioBase64 && payload?.mime) {
        enqueueTTS(payload.audioBase64, payload.mime);
      } else if (useBrowserFallback && ans) {
        speakBrowserTTS(ans);
      }
    } catch (e) {
      console.error('typed question failed', e);
    } finally {
      setTypedQuestion('');
      setShowTypeBox(false);
      setHint('');
    }
  };

  const startBrowserSTTLoop = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Browser STT not supported. Use Chrome/Edge or enable backend STT.');
        return;
      }
      const recog = new SpeechRecognition();
      recog.lang = 'en-US';
      recog.continuous = true;
      recog.interimResults = false;
      recog.onresult = async (evt) => {
        const last = evt.results[evt.results.length - 1];
        if (!last || !last.isFinal) return;
        const text = last[0]?.transcript?.trim();
        if (!text) return;
        setLastTranscript(text);
        try {
          const sim = await aiAgentAPI.simulateCall({ customerName: identity, question: text });
          const data = sim?.data || {};
          const ans = data?.data?.response || data?.data?.answer || data?.response || '';
          if (ans) {
            setLastAnswer(ans);
            speakBrowserTTS(ans);
          }
        } catch (e) {
          console.error('browser STT loop failed', e);
        }
      };
      recog.onerror = (e) => {
        console.error('STT error', e);
      };
      recog.onend = () => {
        if (enableLoop && useBrowserFallback) {
          try { recog.start(); } catch {}
        }
      };
      recognitionRef.current = recog;
      recog.start();
    } catch (e) {
      setError(e.message || 'Failed to start browser STT');
    }
  };

  const stopBrowserSTTLoop = () => {
    try {
      const recog = recognitionRef.current;
      if (recog) {
        try { recog.onresult = null; } catch {}
        try { recog.onend = null; } catch {}
        try { recog.stop(); } catch {}
      }
      recognitionRef.current = null;
    } catch {}
  };

  const speakBrowserTTS = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      // Try to pick a female-sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      let preferred = null;
      if (selectedBrowserVoice) {
        preferred = voices.find(v => v.name === selectedBrowserVoice) || null;
      }
      if (!preferred) {
        preferred = voices.find(v => /female|woman/i.test(v.name))
          || voices.find(v => /Zira|Jenny|Aria|Samantha|Victoria|Karen|Serena/i.test(v.name))
          || voices.find(v => /en-US|en-GB/i.test(v.lang));
      }
      if (preferred) u.voice = preferred;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const startProbeTimer = () => {
    stopProbeTimer();
    probeIntervalRef.current = setInterval(async () => {
      if (!useBrowserFallback) return;
      if (Date.now() < cooldownUntilRef.current) return;
      if (status !== 'connected') return;
      const localAudio = localAudioTrackRef.current;
      if (!localAudio || !localAudio.mediaStreamTrack) return;
      try {
        const stream = new MediaStream([localAudio.mediaStreamTrack]);
        const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        await new Promise((resolve) => {
          const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
          rec.ondataavailable = async (ev) => {
            if (!ev.data || ev.data.size < 2048) { resolve(); return; }
            try {
              const resp = await voiceAPI.sttRespond(ev.data, selectedServerVoice);
              const payload = resp?.data?.data || {};
              const fallbackPhrase = "Let me check with my supervisor and get back to you.";
              const isBeep = payload?.mime === 'audio/wav';
              const emptyTranscript = !payload?.transcript || payload.transcript.trim() === '';
              const isFallbackAnswer = (payload?.answer || '').trim() === fallbackPhrase;
              const degraded = (isBeep && emptyTranscript) || isFallbackAnswer;
              if (!degraded) {
                setNotice('Server speech recovered. Switched back to server STT/TTS.');
                setUseBrowserFallback(false);
                setTimeout(() => {
                  stopLoop();
                  if (status === 'connected' && enableLoop) startLoop();
                }, 80);
              }
            } catch {}
            resolve();
          };
          rec.start(600);
          setTimeout(() => { try { rec.stop(); } catch {} }, 650);
        });
      } catch {}
    }, 5000);
  };

  const stopProbeTimer = () => {
    if (probeIntervalRef.current) {
      try { clearInterval(probeIntervalRef.current); } catch {}
      probeIntervalRef.current = null;
    }
  };

  // Populate available browser voices for selection
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setAvailableBrowserVoices(v);
      if (!selectedBrowserVoice) {
        const defaultV = v.find(x => /Zira|Jenny|Aria|Samantha|Victoria|Karen|Serena/i.test(x.name)) || v[0];
        if (defaultV) setSelectedBrowserVoice(defaultV.name);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Live Voice (LiveKit)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identity</label>
            <input className="w-full px-3 py-2 border rounded" value={identity} onChange={(e) => setIdentity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input className="w-full px-3 py-2 border rounded" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Server URL</label>
            <input className="w-full px-3 py-2 border rounded" value={LIVEKIT_URL || ''} readOnly />
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <button onClick={join} disabled={status==='connecting'||status==='connected'||status==='requesting-token'} className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-400">Join & Publish Mic</button>
          <button onClick={leave} disabled={status==='idle'} className="px-4 py-2 rounded bg-gray-700 text-white disabled:bg-gray-400">Leave</button>
          <span className="text-sm text-gray-600">Status: {status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Server voice</label>
            <select className="w-full px-3 py-2 border rounded" value={selectedServerVoice} onChange={(e) => setSelectedServerVoice(e.target.value)}>
              <option value="verse">Verse (female)</option>
              <option value="alloy">Alloy</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Applies when browser STT/TTS is off.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Browser voice</label>
            <select className="w-full px-3 py-2 border rounded" value={selectedBrowserVoice} onChange={(e) => setSelectedBrowserVoice(e.target.value)}>
              {availableBrowserVoices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Used when browser STT/TTS is on.</p>
          </div>
        </div>

        <label className="flex items-center text-sm text-gray-700 mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={enableLoop}
            onChange={(e) => {
              setEnableLoop(e.target.checked);
              if (e.target.checked) {
                if (!useBrowserFallback && status !== 'connected') {
                  setError('Join the room first or enable browser STT/TTS.');
                  return;
                }
                startLoop();
              } else {
                stopLoop();
              }
            }}
            disabled={!useBrowserFallback && status !== 'connected'}
          />
          Enable voice loop (STT ↔ TTS)
        </label>

        <label className="flex items-center text-sm text-gray-700 mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={useBrowserFallback}
            onChange={(e) => {
              setUseBrowserFallback(e.target.checked);
              if (enableLoop && status === 'connected') {
                stopLoop();
                startLoop();
              }
            }}
          />
          Use browser STT/TTS (no API key required)
        </label>

        {(lastTranscript || lastAnswer) && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
            {lastTranscript && (
              <p className="text-gray-700"><span className="font-semibold">You:</span> {lastTranscript}</p>
            )}
            {lastAnswer && (
              <p className="text-gray-700 mt-1"><span className="font-semibold">Agent:</span> {lastAnswer}</p>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
        )}

        {notice && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="text-blue-700 hover:text-blue-900">×</button>
          </div>
        )}

        {hint && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded flex items-center justify-between">
            <span className="text-sm">{hint}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTypeBox(true)} className="px-2 py-1 text-xs rounded bg-yellow-600 text-white">Type it</button>
              <button onClick={() => setHint('')} className="text-yellow-800 hover:text-yellow-900">×</button>
            </div>
          </div>
        )}

        {showTypeBox && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded text-sm"
              placeholder="Type your question..."
              value={typedQuestion}
              onChange={(e) => setTypedQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendTypedQuestion(); }}
            />
            <button onClick={sendTypedQuestion} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Send</button>
            <button onClick={() => setShowTypeBox(false)} className="px-3 py-2 rounded bg-gray-200 text-gray-800 text-sm">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs font-semibold text-gray-700 mb-1">Status</p>
            <span className={`inline-block px-2 py-1 text-xs rounded ${status==='connected'?'bg-green-100 text-green-800':'bg-gray-200 text-gray-800'}`}>{status}</span>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs font-semibold text-gray-700 mb-1">Mic level</p>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div className="h-2 bg-green-500 rounded" style={{width: `${micLevel}%`}} />
            </div>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs font-semibold text-gray-700 mb-1">Participants</p>
            <div className="text-xs text-gray-700">{participants.length ? participants.join(', ') : 'None'}</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
          <p className="text-xs font-semibold text-gray-700 mb-2">Quick test</p>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await voiceAPI.tts('Hi there, I am here to help.');
                  const blob = new Blob([res.data], { type: 'audio/mpeg' });
                  enqueueTTS(await blobToBase64(blob), 'audio/mpeg');
                } catch (e) { console.error('server tts test failed', e); }
              }}
              className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
              disabled={useBrowserFallback}
            >Test server voice</button>
            <button
              onClick={() => speakBrowserTTS('Hi there, I am here to help.')}
              className="px-3 py-2 rounded bg-gray-700 text-white text-sm"
            >Test browser voice</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Server test uses the selected server voice; browser test uses your OS voice.</p>
        </div>
      </div>
    </div>
  );
};
