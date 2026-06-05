'use strict';

/**
 * reel-pipeline.js — Carbon Films Reels Squad v3
 *
 * Estilo: storytelling cinematográfico, caixa de vídeo centralizada,
 *         fundo preto, 1 palavra por vez, música dark ambient.
 *
 * [1] Claude Haiku  → roteiro storytelling + queries B-roll por cena
 * [2] edge-tts      → voz neural pt-BR (AntonioNeural) + timestamps VTT
 * [3] Pexels        → clips B-roll contextual por segmento
 * [4] FFmpeg        → caixa 1040×780 em canvas 1080×1920 + 1 palavra + ambient
 * [5] Buffer API    → publica como Reel no @carbonfilms.sc
 */

const fs           = require('fs');
const path         = require('path');
const https        = require('https');
const http         = require('http');
const { execSync } = require('child_process');

// ── Caminhos ─────────────────────────────────────────────────────────────────
const ROOT       = path.join(__dirname, '..');
const REELS_DIR  = path.join(ROOT, 'output', 'reels');
const TEMP_DIR   = path.join(REELS_DIR, 'tmp');
const SLIDES_DIR = path.join(ROOT, 'output', 'slides');
const MUSIC_DIR  = path.join(ROOT, 'assets', 'music');
const LOG_PATH   = path.join(ROOT, 'logs', 'reel.log');

const VPS_URL    = 'http://76.13.172.41:8080';
const CHANNEL_ID = '69ff20b95c4c051afa293dc1';
const VOICE      = 'pt-BR-AntonioNeural';  // Brasileiro — sem sotaque estrangeiro
const VOICE_RATE  = '-28%';               // narrador lento e reflexivo, como documentário
// pitch padrão — não alteramos, soa mais natural

// Fontes disponíveis
const FONT_BOLD    = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
const FONT_REGULAR = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf';

// Layout: caixa de vídeo centralizada em canvas preto
const BOX_W      = 1040;  // largura da caixa
const BOX_H      = 780;   // altura da caixa (4:3)
const BOX_X      = 20;    // margem esquerda
const BOX_Y      = 450;   // posição vertical da caixa
const BOX_CORNER = 22;    // raio dos cantos arredondados (px)
const CANVAS_W   = 1080;
const CANVAS_H   = 1920;

// Centro da caixa (onde as legendas ficam)
const CAP_CX  = Math.round(CANVAS_W / 2);       // 540
const CAP_CY  = BOX_Y + Math.round(BOX_H / 2);  // 840

// Watermark abaixo da caixa
const WM_Y    = BOX_Y + BOX_H + 80;             // 1310

// Máscara de cantos arredondados (gerada uma vez)
const MASK_PATH = path.join(ROOT, 'assets', 'box_mask.png');

// ── Flags ────────────────────────────────────────────────────────────────────
const DRY_RUN     = process.argv.includes('--dry-run');
const SCRIPT_ONLY = process.argv.includes('--script-only');  // só mostra o roteiro, sem gerar vídeo

const TOPIC = (() => {
  const i = process.argv.indexOf('--topic');
  return i !== -1 ? process.argv.slice(i + 1).join(' ') : null;
})();

// --audio /caminho/para/narration.mp3  → usa voz humana, pula TTS
const HUMAN_AUDIO = (() => {
  const i = process.argv.indexOf('--audio');
  return i !== -1 ? process.argv[i + 1] : null;
})();

// ── Logging ──────────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_PATH, line + '\n'); } catch {}
}

// ── .env ─────────────────────────────────────────────────────────────────────
function loadEnv() {
  const lines = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function httpRequest(urlStr, opts = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method:   opts.method || 'GET',
      headers:  opts.headers || {},
      timeout:  90000,
    }, res => {
      if ([301, 302, 307].includes(res.statusCode) && res.headers.location) {
        return httpRequest(res.headers.location, opts, body).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)); });
    if (body) req.write(body);
    req.end();
  });
}

async function httpGet(url, headers = {}) {
  return httpRequest(url, { method: 'GET', headers });
}

async function httpPost(url, body, headers = {}) {
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  const buf = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
  }, str);
  return JSON.parse(buf.toString('utf8'));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib  = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      if ([301, 302, 307].includes(res.statusCode) && res.headers.location) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

// Tipos de conteúdo que o pipeline alterna para variedade
const CONTENT_TYPES = [
  'story_empresario',  // história real de empresário brasileiro famoso
  'ai_insight',        // insight/notícia impactante sobre IA e o futuro do trabalho
  'marketing_digital', // verdade contraintuitiva sobre marketing digital e redes sociais
  'story_empresario',  // peso maior para stories (mais engajamento)
  'comportamento',     // insight sobre comportamento humano e decisão de compra
];

// ── [1] Roteiro — conteúdo variado ───────────────────────────────────────────
async function generateScript(env, topic) {
  log(`[1/5] Gerando roteiro (tipo: ${contentType})${topic ? ': "' + topic + '"' : ''}`);

  // Escolhe tipo de conteúdo aleatoriamente (pesado para story)
  const contentType = topic
    ? 'story_empresario'
    : CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)];

  const prompts = {
    story_empresario: `Você é roteirista de mini-documentários virais no Instagram.

Crie um Reel de 38-46 segundos contando uma história REAL de um empresário brasileiro famoso.
Use fatos reais e específicos. Exemplos: Flávio Augusto da Silva (Geração de Valor/Orlando City),
Guilherme Benchimol (XP Investimentos), Tallis Gomes (Easy Taxi/Singu), Joel Jota,
Luiza Trajano (Magazine Luiza), Abilio Diniz, Sílvio Santos. Ou use um caso internacional
adaptado para o contexto brasileiro (Elon Musk no Brasil, Jeff Bezos, Sara Blakely/Spanx, etc.).

TEMA: ${topic || 'escolha a história mais impactante e pouco conhecida de um desses nomes'}

ESTRUTURA:
- Abertura: 1 fato chocante ou momento de crise real. Frases curtíssimas.
- Desenvolvimento: a dor específica, o erro real, o que quase destruiu tudo
- Virada: a decisão ou percepção que mudou tudo — com detalhe real
- Conclusão + CTA sutil

REGRAS:
- Português do Brasil, tom de narrador de documentário, calmo e reflexivo
- Frases curtas — máx 8 palavras. Deixa pausas naturais.
- Use nomes, números, anos reais quando souber
- Sem emojis. Sem clichês como "nunca desista" ou "sonhe grande"
- 75-100 palavras no total (voz lenta = cabe menos palavras)`,

    ai_insight: `Você é roteirista de Reels virais sobre tecnologia e futuro.

Crie um Reel de 38-46 segundos com um insight impactante e REAL sobre Inteligência Artificial
e como ela está mudando o trabalho, os negócios e o comportamento humano.

Use dados e fatos reais e recentes (2023-2025):
- GPT-4, Claude 3, Gemini, Llama 4 e seus impactos reais
- Profissões desaparecendo ou surgindo por causa da IA
- Empresas que usaram IA e triplicaram resultados
- Um dado chocante e verificável sobre o mercado de trabalho

TEMA: ${topic || 'escolha o insight mais contraintuitivo sobre IA que poucos sabem'}

ESTRUTURA:
- Abertura: dado/fato chocante. Cria dúvida imediata.
- Desenvolvimento: o que está acontecendo, por que é irreversível
- Implicação: o que isso significa para empresas e profissionais
- CTA: o que fazer diante disso

REGRAS:
- Tom educativo mas visceral — não é palestra, é conversa
- Frases curtas e diretas
- Sem hype vazio — use fatos específicos
- Sem emojis
- 75-100 palavras no total`,

    marketing_digital: `Você é roteirista de Reels sobre marketing e comportamento do consumidor.

Crie um Reel de 38-46 segundos revelando uma verdade contraintuitiva e verificável
sobre marketing digital, Instagram, algoritmos ou comportamento de compra.

Exemplos de abordagem:
- Por que a maioria gasta dinheiro em tráfego e não converte
- O que realmente faz um perfil crescer no Instagram (não é o que pensam)
- O erro que 90% das empresas cometem no digital
- Por que vídeos superam carrosséis em alcance agora

TEMA: ${topic || 'escolha a verdade mais contraintuitiva que poucos sabem sobre marketing digital'}

ESTRUTURA:
- Abertura: afirmação que vai contra o senso comum
- Desenvolvimento: o erro, a ilusão, o que funciona de verdade
- Dado ou prova: número real, pesquisa, case
- CTA: o que fazer

REGRAS:
- Tom direto, sem rodeios
- Use dados reais quando souber
- Sem emojis. Sem promessas mágicas.
- 75-100 palavras no total`,

    comportamento: `Você é roteirista de Reels sobre psicologia do consumidor e comportamento humano.

Crie um Reel de 38-46 segundos sobre um insight de psicologia ou comportamento humano
aplicado a negócios, decisão de compra, ou construção de marca.

Use insights reais da psicologia comportamental, economia comportamental, ou neurociência:
- Daniel Kahneman, Robert Cialdini, Ariely
- Como o cérebro decide antes de você decidir
- O que realmente vende: lógica ou emoção?
- Por que preço alto aumenta o desejo

TEMA: ${topic || 'escolha o insight de comportamento humano mais poderoso para negócios'}

ESTRUTURA:
- Abertura: afirmação paradoxal que intriga
- Desenvolvimento: o mecanismo, como funciona de verdade
- Aplicação: o que fazer com esse conhecimento
- CTA

REGRAS:
- Tom de filósofo curioso, não de guru
- Frases curtas
- Sem emojis
- 75-100 palavras no total`,
  };

  const basePrompt = prompts[contentType] || prompts.story_empresario;

  const fullPrompt = `${basePrompt}

Para cada cena, gere uma query em INGLÊS para B-roll cinematográfico que combine com o momento narrativo.
Use imagens dramáticas, cinematográficas: silhuetas, close de mãos, cidade noturna, telas de computador, pessoas em decisão.

Retorne SOMENTE JSON, sem markdown:
{
  "hook_text": "FRASE DE ABERTURA (máx 5 palavras, impacto imediato)",
  "narration": "texto completo da narração do início ao fim",
  "scenes": [
    {"label": "abertura", "query": "dramatic cinematic broll query in english"},
    {"label": "desenvolvimento", "query": "cinematic broll query"},
    {"label": "virada", "query": "cinematic broll query"},
    {"label": "cta", "query": "confident visual broll query"}
  ],
  "caption": "legenda Instagram com o conteúdo em 3 parágrafos impactantes + CTA para DM ou seguir, sem emojis",
  "content_type": "${contentType}"
}`;

  const res = await httpPost(
    'https://api.anthropic.com/v1/messages',
    { model: 'claude-haiku-4-5-20251001', max_tokens: 1400,
      messages: [{ role: 'user', content: fullPrompt }] },
    { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }
  );

  if (res.error) throw new Error(`Claude: ${res.error.message}`);
  const text  = res.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude não retornou JSON: ' + text.slice(0, 200));
  const script = JSON.parse(match[0]);

  log(`  Hook: ${script.hook_text}`);
  log(`  Narração: ${script.narration.split(' ').length} palavras`);
  log(`  Cenas: ${script.scenes.map(s => s.label).join(', ')}`);
  return script;
}

// ── [2] Voz: humana (--audio) ou TTS fallback ────────────────────────────────
async function generateVoice(text) {
  const whisperScript = path.join(__dirname, 'whisper-align.py');
  let audioPath;

  if (HUMAN_AUDIO) {
    // ── Modo voz humana ──────────────────────────────────────────────────────
    if (!fs.existsSync(HUMAN_AUDIO)) {
      throw new Error(`Arquivo de áudio não encontrado: ${HUMAN_AUDIO}`);
    }
    // Copia para o temp dir como narration.mp3
    audioPath = path.join(TEMP_DIR, 'narration.mp3');
    execSync(`ffmpeg -y -i "${HUMAN_AUDIO}" -c:a mp3 -q:a 2 "${audioPath}"`, { stdio: 'pipe' });
    log(`[2/5] Usando áudio humano: ${path.basename(HUMAN_AUDIO)}`);
  } else {
    // ── Modo TTS (fallback) ──────────────────────────────────────────────────
    audioPath = path.join(TEMP_DIR, 'narration.mp3');
    log(`[2/5] Gerando voz TTS (${VOICE}, rate=${VOICE_RATE})...`);
    execSync(
      `edge-tts --voice ${VOICE} --rate=${VOICE_RATE} ` +
      `--text ${JSON.stringify(text)} --write-media "${audioPath}"`,
      { stdio: 'pipe' }
    );
  }

  const duration = getAudioDuration(audioPath);
  log(`  Áudio: ${duration.toFixed(1)}s — alinhando com Whisper (modelo small)...`);

  let words = [];
  try {
    const raw = execSync(
      `python3 "${whisperScript}" "${audioPath}" ${JSON.stringify(text)}`,
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 180000 }
    ).toString().trim();
    words = JSON.parse(raw).filter(w => w.word.trim());
    log(`  Whisper: ${words.length} palavras alinhadas`);
  } catch (e) {
    log(`  Whisper falhou (${e.message.slice(0, 60)}), usando fallback linear`);
    const wl = text.split(/\s+/).filter(Boolean);
    words = wl.map((w, i) => ({
      word:  w,
      start: (i / wl.length) * duration,
      end:   ((i + 1) / wl.length) * duration,
    }));
  }

  return { audioPath, duration, words };
}

function getAudioDuration(p) {
  try {
    const d = JSON.parse(execSync(`ffprobe -v quiet -print_format json -show_streams "${p}"`).toString());
    return parseFloat(d.streams[0]?.duration || 35);
  } catch { return 35; }
}

// ── [3] B-roll contextual por cena ───────────────────────────────────────────
async function fetchBRoll(env, scenes, totalDuration) {
  log('[3/5] Buscando B-roll por cena...');

  const clips       = [];
  const secPerScene = totalDuration / scenes.length;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    try {
      const buf  = await httpGet(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(scene.query)}&orientation=portrait&per_page=10&min_duration=5&max_duration=25`,
        { Authorization: env.PEXELS_API_KEY }
      );
      const data = JSON.parse(buf.toString());
      if (!data.videos?.length) { log(`  Cena "${scene.label}": sem resultado`); continue; }

      // Embaralha e pega o melhor disponível
      const video = data.videos
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .find(v => v.video_files.some(f => f.width && f.height && f.width < f.height))
        || data.videos[Math.floor(Math.random() * Math.min(data.videos.length, 3))];

      const file = video.video_files
        .filter(f => f.width && f.height && f.width < f.height)
        .sort((a, b) => b.width - a.width)[0]
        || video.video_files.sort((a, b) => b.width - a.width)[0];

      if (!file?.link) continue;

      const dest = path.join(TEMP_DIR, `scene-${i}.mp4`);
      log(`  [${i + 1}/${scenes.length}] "${scene.label}" → ${scene.query.slice(0, 42)}... (${file.width}×${file.height}, ${video.duration}s)`);
      await downloadFile(file.link, dest);
      clips.push({ path: dest, duration: video.duration, label: scene.label, targetDuration: secPerScene });
    } catch (e) {
      log(`  Aviso cena ${i}: ${e.message}`);
    }
  }

  if (!clips.length) throw new Error('Nenhum clip B-roll disponível');
  log(`  ${clips.length}/${scenes.length} cenas com vídeo`);
  return clips;
}

// ── [4a] Música dark ambient (Cm drone) ──────────────────────────────────────
async function getBackgroundMusic(duration) {
  log('  Gerando música dark ambient (Cm drone)...');

  if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR, { recursive: true });
  const cached = path.join(MUSIC_DIR, 'ambient-dark-v3.mp3');

  if (fs.existsSync(cached)) {
    log('  Música em cache reutilizada');
    return cached;
  }

  // Acorde Cm menor: C2(65.41) + Eb2(77.78) + G2(98.00) + Bb2(116.54)
  // Reverb profundo → sound design cinematográfico
  const dur = duration + 15;
  const fadeOut = dur - 6;
  execSync(
    `ffmpeg -y ` +
    `-f lavfi -i "sine=frequency=65.41:sample_rate=44100" ` +
    `-f lavfi -i "sine=frequency=77.78:sample_rate=44100" ` +
    `-f lavfi -i "sine=frequency=98.00:sample_rate=44100" ` +
    `-f lavfi -i "sine=frequency=116.54:sample_rate=44100" ` +
    `-filter_complex ` +
    `"[0:a]volume=0.35[a0];[1:a]volume=0.18[a1];[2:a]volume=0.12[a2];[3:a]volume=0.08[a3];` +
    `[a0][a1][a2][a3]amix=inputs=4[mixed];` +
    `[mixed]aecho=0.96:0.92:5000:0.50,aecho=0.88:0.86:8000:0.35,aecho=0.75:0.75:12000:0.20,` +
    `lowpass=f=500,highpass=f=25,volume=1.0,` +
    `afade=t=in:st=0:d=7,afade=t=out:st=${fadeOut}:d=7[out]" ` +
    `-map "[out]" -t ${dur} -c:a mp3 -q:a 4 "${cached}"`,
    { stdio: 'pipe' }
  );
  log('  Dark ambient Cm gerado');
  return cached;
}

// ── [4b] Legendas ASS — 1 palavra por vez, estilo modelo ─────────────────────
function buildAssSubtitles(words, hookText, duration, outPath) {
  const events = [];
  const narStart = words[0]?.start || 0;

  // Hook: palavras do hook aparecem uma por uma antes da narração
  if (hookText && narStart > 0.3) {
    const hw    = hookText.toUpperCase().split(/\s+/).filter(Boolean);
    const step  = (narStart - 0.15) / hw.length;
    hw.forEach((w, i) => {
      events.push({
        text:   w,
        start:  0.08 + i * step,
        end:    0.08 + (i + 1) * step - 0.06,
        isHook: true,
      });
    });
  }

  // Narração: 1 palavra por evento, lowercase, segue timestamps da voz
  for (const w of words) {
    const hold = Math.max(w.end - w.start, 0.18);
    events.push({
      text:   w.word.toLowerCase().replace(/[.,!?:;]+$/, ''),
      start:  w.start,
      end:    w.start + hold + 0.04,
      isHook: false,
    });
  }

  function toAss(s) {
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    const cs = Math.round((s % 1) * 100);
    return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }

  // Watermark em spaced uppercase abaixo da caixa
  const wmText = '@ C A R B O N F I L M S . S C';
  const assEnd = toAss(duration + 2);

  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${CANVAS_W}
PlayResY: ${CANVAS_H}
WrapStyle: 1

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Word,LiberationSans,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,100,100,0,0,1,4,0,5,0,0,0,1
Style: Hook,LiberationSans,100,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,100,110,0,0,1,5,0,5,0,0,0,1
Style: Watermark,LiberationSans,26,&HA6FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,100,100,3,0,1,0,0,2,0,0,${CANVAS_H - WM_Y},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
Dialogue: 0,0:00:00.00,${assEnd},Watermark,,0,0,0,,${wmText}
${events.map(g => {
  const style   = g.isHook ? 'Hook' : 'Word';
  const fadeIn  = g.isHook ? 180 : 60;
  const fadeOut = g.isHook ? 200 : 60;
  return `Dialogue: 0,${toAss(g.start)},${toAss(g.end)},${style},,0,0,0,,{\\pos(${CAP_CX},${CAP_CY})\\fad(${fadeIn},${fadeOut})}${g.text}`;
}).join('\n')}
`;

  fs.writeFileSync(outPath, ass);
  log(`  Legendas: ${events.filter(e => e.isHook).length} hook + ${events.filter(e => !e.isHook).length} palavras`);
}

// ── Garante máscara de cantos arredondados ────────────────────────────────────
function ensureBoxMask() {
  if (!fs.existsSync(MASK_PATH)) {
    const script = path.join(__dirname, 'make-box-mask.py');
    execSync(`python3 "${script}" "${MASK_PATH}"`, { stdio: 'pipe' });
    log(`  Máscara gerada: ${MASK_PATH}`);
  }
}

// ── [4c] Montar vídeo final ───────────────────────────────────────────────────
async function assembleVideo(clips, audioPath, duration, words, hookText, musicPath, outPath) {
  log('[4/5] Montando vídeo com FFmpeg...');

  ensureBoxMask();

  // Processa cada clip usando filter_complex:
  // 1. Escala para caixa 1040×780, aplica cinematic grade + grain + vignette
  // 2. Pad para canvas 1080×1920 com bordas pretas
  // 3. Blend multiply com máscara → cantos arredondados
  const procClips = [];
  for (let i = 0; i < clips.length; i++) {
    const clip       = clips[i];
    const clipTarget = Math.max(7, clip.targetDuration + 2.0);
    const clipDur    = Math.min(clip.duration, clipTarget);
    const procPath   = path.join(TEMP_DIR, `proc-${i}.mp4`);

    const videoFilter =
      `scale=${BOX_W}:${BOX_H}:force_original_aspect_ratio=increase,` +
      `crop=${BOX_W}:${BOX_H},setsar=1,` +
      `eq=saturation=0.72:contrast=1.14:brightness=-0.025:gamma=0.96,` +
      `noise=c0s=4:allf=t,` +
      `vignette=PI/4.5,` +
      `pad=${CANVAS_W}:${CANVAS_H}:${BOX_X}:${BOX_Y}:black`;

    // Máscara RGBA: centro transparente (mostra vídeo), cantos pretos opacos
    // overlay sem problemas de YUV — não tem color shift verde
    execSync(
      `ffmpeg -y -i "${clip.path}" -loop 1 -i "${MASK_PATH}" ` +
      `-filter_complex "[0:v]${videoFilter}[padded];[1:v]format=rgba[mask];[padded][mask]overlay=0:0:format=auto[out]" ` +
      `-map "[out]" -t ${clipDur} -c:v libx264 -preset fast -crf 23 -r 30 -an "${procPath}"`,
      { stdio: 'pipe' }
    );
    procClips.push(procPath);
  }

  // Concat
  const concatLines = [];
  let accumulated = 0;
  for (const p of procClips) {
    const pd = getAudioDuration(p);
    concatLines.push(`file '${p}'`);
    accumulated += pd;
  }
  while (accumulated < duration + 1 && procClips.length > 0) {
    concatLines.push(`file '${procClips[procClips.length - 1]}'`);
    accumulated += 5;
  }

  const concatList = path.join(TEMP_DIR, 'concat.txt');
  fs.writeFileSync(concatList, concatLines.join('\n'));

  const concatPath = path.join(TEMP_DIR, 'concat.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -t ${duration + 0.5} ` +
    `-c:v libx264 -preset fast -crf 23 -r 30 "${concatPath}"`,
    { stdio: 'pipe' }
  );

  // Legendas ASS (1 palavra por vez + watermark)
  const assPath    = path.join(TEMP_DIR, 'captions.ass');
  buildAssSubtitles(words, hookText, duration, assPath);
  const assEscaped = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  // Merge final: vídeo + legendas + voz + dark ambient
  // Música a 22% — audível porém sem cobrir a voz
  const musicStart = Math.max(0, duration - 2.5);
  const musicFilter =
    `[1:a]volume=0.22,afade=t=out:st=${musicStart}:d=2.5[music];` +
    `[2:a]volume=1.0[voice];` +
    `[voice][music]amix=inputs=2:duration=first:weights=1 0.22[aout]`;

  execSync(
    `ffmpeg -y -i "${concatPath}" -i "${musicPath}" -i "${audioPath}" ` +
    `-vf "ass='${assEscaped}'" ` +
    `-filter_complex "${musicFilter}" ` +
    `-map 0:v -map "[aout]" ` +
    `-c:v libx264 -preset medium -crf 20 -r 30 ` +
    `-c:a aac -b:a 192k -shortest "${outPath}"`,
    { stdio: 'pipe' }
  );

  log(`  Vídeo montado: ${outPath}`);
}

// ── [5] Publicar via Buffer ───────────────────────────────────────────────────
async function publishReel(env, videoUrl, caption) {
  log('[5/5] Publicando Reel via Buffer...');

  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess { post { id status dueAt } }
        ... on InvalidInputError  { message }
        ... on LimitReachedError  { message }
        ... on UnauthorizedError  { message }
        ... on UnexpectedError    { message }
        ... on RestProxyError     { message }
      }
    }`;

  const res = await httpPost(
    'https://api.buffer.com/',
    {
      query:     mutation,
      variables: {
        input: {
          channelId:      CHANNEL_ID,
          schedulingType: 'automatic',
          mode:           'shareNow',
          text:           caption,
          assets:         { video: { url: videoUrl, thumbnailUrl: videoUrl } },
          metadata:       { instagram: { type: 'reel', shouldShareToFeed: true } },
        },
      },
    },
    { Authorization: `Bearer ${env.BUFFER_ACCESS_TOKEN}` }
  );

  return res?.data?.createPost;
}

// ── Análise de engajamento ────────────────────────────────────────────────────
async function analyzeEngagement(env, script, duration) {
  log('Analisando potencial de engajamento...');
  const res = await httpPost(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Você é expert em algoritmo do Instagram Reels (2026).

Analise este Reel de storytelling de ${duration.toFixed(0)}s:

HOOK: ${script.hook_text}
NARRAÇÃO: ${script.narration}

Avalie em 1-10 e feedback direto em PT-BR:
1. Hook (para o scroll nos 1s?)
2. Retenção emocional (alguém assiste até o fim?)
3. CTA eficácia
4. Nota final e 1 melhoria urgente.

Máx 6 linhas, seja brutal.`,
      }],
    },
    { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }
  );
  const analysis = res.content?.[0]?.text || '';
  log('\n=== ANÁLISE DE ENGAJAMENTO ===');
  analysis.split('\n').forEach(l => l.trim() && log(`  ${l}`));
  log('==============================\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const inputDir = path.join(ROOT, 'input');
  [REELS_DIR, TEMP_DIR, path.join(ROOT, 'logs'), MUSIC_DIR, inputDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const env   = loadEnv();
  const topic = TOPIC || null;  // null = conteúdo aleatório do pool

  log('=== Carbon Films — Reel Pipeline v3 ===');
  if (HUMAN_AUDIO) log(`Áudio humano: ${HUMAN_AUDIO}`);
  log(`Modo:   ${SCRIPT_ONLY ? 'ROTEIRO ONLY' : DRY_RUN ? 'DRY RUN' : 'PUBLICAR'}`);

  const script = await generateScript(env, topic);

  // ── Modo --script-only: mostra roteiro e encerra ─────────────────────────
  if (SCRIPT_ONLY) {
    console.log('\n' + '─'.repeat(60));
    console.log('ROTEIRO GERADO — grave esse texto no seu microfone:');
    console.log('─'.repeat(60));
    console.log(`\n${script.narration}\n`);
    console.log('─'.repeat(60));
    console.log(`Hook: ${script.hook_text}`);
    console.log(`\nQuando gravar, salve em:\n  /root/social-media/input/narration.mp3\n`);
    console.log('Depois rode:\n  node scripts/reel-pipeline.js --audio /root/social-media/input/narration.mp3 --dry-run');
    console.log('─'.repeat(60) + '\n');
    return;
  }

  const { audioPath, duration, words } = await generateVoice(script.narration);

  await analyzeEngagement(env, script, duration);

  const clips     = await fetchBRoll(env, script.scenes, duration);
  const musicPath = await getBackgroundMusic(duration);

  const videoName = `reel-${Date.now()}.mp4`;
  const videoPath = path.join(SLIDES_DIR, videoName);
  await assembleVideo(clips, audioPath, duration, words, script.hook_text, musicPath, videoPath);

  fs.copyFileSync(videoPath, path.join(SLIDES_DIR, 'reel-latest.mp4'));

  const sizeMB   = (fs.statSync(videoPath).size / 1024 / 1024).toFixed(1);
  const videoUrl = `${VPS_URL}/reel-latest.mp4`;

  log(`Vídeo: ${sizeMB} MB`);
  log(`URL:   ${videoUrl}`);

  if (DRY_RUN) {
    log('=== DRY RUN — vídeo pronto, sem publicação ===');
    log(`Assista: ${videoUrl}`);
    try { execSync(`rm -rf "${TEMP_DIR}"`); fs.mkdirSync(TEMP_DIR); } catch {}
    return;
  }

  // Garante servidor HTTP ativo
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -q 200`);
  } catch {
    const { spawn } = require('child_process');
    spawn('python3', ['-m', 'http.server', '8080'], { cwd: SLIDES_DIR, detached: true, stdio: 'ignore' }).unref();
    execSync('sleep 2');
  }

  const result = await publishReel(env, videoUrl, script.caption);
  log(`Buffer: ${JSON.stringify(result)}`);
  log('=== Reel publicado com sucesso ===');

  try { execSync(`rm -rf "${TEMP_DIR}"`); fs.mkdirSync(TEMP_DIR); } catch {}
}

main().catch(err => {
  log(`ERRO FATAL: ${err.message}\n${err.stack}`);
  process.exit(1);
});
