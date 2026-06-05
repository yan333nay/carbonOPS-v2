/**
 * Transcrição de áudio via OpenAI Whisper.
 * Baixa o áudio da Evolution API e transcreve para texto.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const OpenAI = require('openai');
const { Readable } = require('stream');

const BASE_URL  = process.env.EVOLUTION_URL || 'http://localhost:8081';
const API_KEY   = process.env.EVOLUTION_API_KEY;
const INSTANCE  = process.env.EVOLUTION_INSTANCE || 'carbonfilms';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Baixa o áudio da Evolution API como buffer.
 * @param {object} msgData - O objeto data completo do webhook
 * @returns {Buffer|null}
 */
async function downloadAudio(msgData) {
  const res = await fetch(`${BASE_URL}/chat/getBase64FromMediaMessage/${INSTANCE}`, {
    method: 'POST',
    headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msgData }),
  });
  const json = await res.json();
  if (!json?.base64) return null;
  return Buffer.from(json.base64, 'base64');
}

/**
 * Transcreve um áudio usando OpenAI Whisper.
 * @param {object} msgData - O objeto data completo do webhook
 * @returns {string|null} Texto transcrito ou null se falhar
 */
async function transcribeAudio(msgData) {
  if (!OPENAI_KEY) {
    console.warn('[transcribe] OPENAI_API_KEY não configurado — áudio ignorado');
    return null;
  }

  try {
    const audioBuffer = await downloadAudio(msgData);
    if (!audioBuffer) {
      console.warn('[transcribe] Não foi possível baixar o áudio');
      return null;
    }

    const openai = new OpenAI({ apiKey: OPENAI_KEY });

    // Cria um File-like object a partir do buffer (compatível com OpenAI SDK)
    const { File } = await import('node:buffer');
    const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg; codecs=opus' });

    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });

    const text = transcript.text?.trim();
    console.log(`[transcribe] Áudio transcrito: "${text?.substring(0, 80)}"`);
    return text || null;

  } catch (err) {
    console.error('[transcribe] Erro:', err.message);
    return null;
  }
}

/**
 * Detecta se um payload de mensagem é um áudio (ptt ou audioMessage).
 */
function isAudioMessage(msgData) {
  return !!(msgData?.message?.audioMessage || msgData?.message?.pttMessage);
}

module.exports = { transcribeAudio, isAudioMessage };
