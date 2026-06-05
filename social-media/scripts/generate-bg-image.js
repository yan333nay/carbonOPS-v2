/**
 * generate-bg-image.js
 * Gera imagens via OpenRouter (Gemini / Flux) para posts Carbon Films.
 * Usa prompt-library.yaml para prompts fiéis à marca.
 *
 * Modos:
 *   background  — imagem de fundo para slides HTML (sem texto)
 *   full-post   — imagem completa pronta para postar (com texto embutido via Gemini)
 *
 * Uso:
 *   node generate-bg-image.js --mode background --slide 1 --topic "erros de marketing"
 *   node generate-bg-image.js --mode full-post --hook "3 erros" --body "texto" --output out.png
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKILL_SCRIPT = path.join(ROOT, '.claude/skills/generate-image/scripts/generate_image.py');
const PROMPT_LIBRARY = path.join(ROOT, 'data', 'prompt-library.yaml');
const BG_DIR = path.join(ROOT, 'output', 'backgrounds');
const POSTS_DIR = path.join(ROOT, 'output', 'posts');

// Modelos disponíveis
const MODELS = {
  free:    'google/gemini-2.0-flash-exp:free',
  flash:   'google/gemini-2.0-flash-exp:free',
  pro:     'black-forest-labs/flux-1.1-pro',
  flux:    'black-forest-labs/flux-1.1-pro',
};

// ---------------------------------------------------------------
// BRANDBOOK CARBON FILMS — para context de prompts
// ---------------------------------------------------------------
const BRAND_CONTEXT = `
Carbon Films is a Brazilian marketing agency from Santa Catarina.
Brand aesthetic: ultra dark premium (#050505 backgrounds), gold accent (#C9A84C),
cinematic high-contrast lighting, Anton bold typography, professional authority.
ALL backgrounds must work as base for white/red text overlay.
`;

// ---------------------------------------------------------------
// BASE DE PROMPTS POR TIPO DE SLIDE
// ---------------------------------------------------------------
const SLIDE_PROMPTS = {
  capa: {
    default: `Ultra dramatic dark marketing background for a Brazilian agency post.
Deep black (#050505) base, subtle warm gold bokeh or light gradient from one corner,
premium cinematic feel, strong contrast, absolutely NO text, NO watermarks, NO logos.
Space for bold white typography overlay. Professional 4K photography quality.`,

    marketing: `Dark cinematic marketing workspace, premium black desk with laptop glowing,
subtle gold light reflections, moody dramatic shadows, bokeh background.
Deep black base (#050505), NO text, NO watermarks. 4K ultra-sharp.`,

    urgencia: `Dramatic dark background with subtle tension — deep shadows,
minimal gold accent lighting, premium cinematic grade, serious authoritative mood.
NO text, NO watermarks. 4K.`,
  },

  corpo: {
    default: `Minimal dark premium background, deep black (#050505),
subtle cinematic texture, soft gradient lighting from one side,
professional marketing agency aesthetic, clean for text overlay.
NO text, NO logos, NO watermarks. 4K.`,

    analytics: `Dark cinematic analytics environment, screens with abstract data glow,
deep shadows, ultra premium feel, NO visible text on screens,
professional photography, 4K.`,

    workspace: `Dark premium workspace detail, black surface with subtle product,
dramatic side lighting creating shadows, professional moody atmosphere.
NO people, NO text, NO watermarks. 4K macro.`,

    producao: `Professional video production equipment in darkness, cinema camera silhouette,
warm gold practical lights, premium feel, NO people, NO text. 4K.`,
  },

  cta: {
    default: `Aerial night photography of modern dark Brazilian city, premium bokeh street lights,
dramatic angle from above, deep black sky, gold and white light trails.
Cinematic, NO text, NO logos. 4K photography.`,

    premium: `Dark luxury abstract background, deep black, subtle gold particle light trails,
premium expensive aesthetic, aspirational mood, space for centered CTA text.
NO text, NO watermarks. 4K digital art.`,
  },

  dramatico: {
    money_burning: `Brazilian Real banknotes catching fire on dark surface,
dramatic flame illumination, deep black background, cinematic macro photography,
rich golden orange fire, NO text, NO watermarks. 4K.`,

    film_reel: `35mm film reel on dark reflective surface, dramatic side lighting,
gold metallic sheen on film strip, depth of field blur, premium product photography.
NO text, NO watermarks. 4K.`,

    camera_hero: `Extreme close-up of professional cinema camera lens, dramatic studio lighting,
black body with gold metallic elements, shallow depth of field, dark background.
NO text, NO watermarks. 4K.`,

    chess_power: `Gold chess queen piece on dark reflective surface,
dramatic overhead single-source lighting, luxury premium feel, strategy metaphor.
NO text, NO watermarks. 4K.`,
  },
};

// ---------------------------------------------------------------
// PROMPTS DE POST COMPLETO (imagem que inclui o texto via IA)
// Usado quando queremos que a IA gere a imagem com layout
// ---------------------------------------------------------------
const FULL_POST_PROMPTS = {
  educational: (hook, body, label) => `
Create a professional dark social media post image for Carbon Films, a Brazilian marketing agency.

LAYOUT SPECIFICATIONS:
- Canvas: 1080x1350px (4:5 portrait format)
- Background: Ultra dark #050505 near-black
- Top-left: "CARBON FILMS" in gold (Anton font style, bold)
- Top-right: "${label || 'CF_001 / MARKETING'}" in gray monospace tiny text
- Center-bottom area: Big bold white headline text: "${hook}"
- Last word of headline in red (#FF0000)
- Thin gold horizontal line (64px wide, 3px height) below headline
- Body text in gray below the line: "${body || ''}"
- Handle "@carbonfilms.sc" bottom-left in small gray monospace

STYLE RULES:
- Anton-style ultra-bold uppercase font for headline
- High contrast: white/red text on black background
- Subtle dark texture/grain
- NO extra elements, NO decorations
- Clean, premium, authoritative Brazilian agency aesthetic
- Print-ready professional quality

Carbon Films brand: dark, cinematic, gold accents, authority, results.
`,

  carousel_cover: (hook, label) => `
Create a professional Instagram carousel cover image for Carbon Films, a Brazilian marketing agency.

EXACT LAYOUT:
- Canvas: 1080x1080px (square format)
- Pure black background (#050505)
- TOP-LEFT: "CARBON FILMS" text in gold/amber color, Anton bold style, 22px
- TOP-RIGHT: "${label || 'CF_001 / MARKETING'}" very small gray monospace text
- BOTTOM section (last 35% of image):
  - Headline in white Anton ultra-bold uppercase: "${hook}"
  - The last word of the headline must be in RED (#FF0000)
  - Below headline: thin gold horizontal line (64px wide)
  - Below line: "${label || 'CF_001 / MARKETING'}" tiny gray text

STYLE:
- Deep dark premium background with subtle film grain texture
- Ultra-high contrast typography
- NO background image, pure solid dark background
- Professional Brazilian marketing agency, cinematic feel
- Clean and powerful, designed to stop scrolling
`,

  motivacional: (hook, cta) => `
Create a dark motivational social media image for Carbon Films agency.

LAYOUT:
- Canvas: 1080x1920px (9:16 Reels/Stories format)
- Pure black background
- TOP-CENTER: "CARBON FILMS" in gold, small, elegant
- CENTER: Big bold white text (Anton style, uppercase): "${hook}"
- The last word in RED
- Thin gold separator line
- BOTTOM: White button/CTA text: "${cta || 'FALAR COM A CARBON'}"
- Very bottom: "@carbonfilms.sc" tiny gray text

MOOD: Urgent, motivational, confrontational, premium dark aesthetic.
Carbon Films: dark cinematic, gold accents, authority, results.
`,
};

// ---------------------------------------------------------------
// SELECIONA MELHOR PROMPT POR CONTEXTO
// ---------------------------------------------------------------
function selectPrompt(slideType, topic, mode = 'background') {
  if (mode === 'full-post') {
    return null; // full-post usa FULL_POST_PROMPTS diretamente
  }

  const t = (topic || '').toLowerCase();
  const type = (slideType || '').toLowerCase();

  if (type === 'cta') {
    return SLIDE_PROMPTS.cta.default;
  }
  if (type === 'capa') {
    if (t.includes('erro') || t.includes('perda') || t.includes('problema')) return SLIDE_PROMPTS.capa.urgencia;
    if (t.includes('marketing') || t.includes('conteudo') || t.includes('digital')) return SLIDE_PROMPTS.capa.marketing;
    return SLIDE_PROMPTS.capa.default;
  }

  // Corpo — seleciona por tema
  if (t.includes('roi') || t.includes('resultado') || t.includes('metrica')) return SLIDE_PROMPTS.corpo.analytics;
  if (t.includes('video') || t.includes('producao') || t.includes('camera')) return SLIDE_PROMPTS.corpo.producao;
  if (t.includes('estrategia') || t.includes('planej')) return SLIDE_PROMPTS.corpo.workspace;
  return SLIDE_PROMPTS.corpo.default;
}

// ---------------------------------------------------------------
// GERA UMA IMAGEM VIA OPENROUTER
// ---------------------------------------------------------------
function generateImage(prompt, outputPath, model = 'free') {
  const modelId = MODELS[model] || MODELS.free;

  // Garante diretório
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Escapa aspas para o shell
  const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
  const cmd = `python "${SKILL_SCRIPT}" "${escapedPrompt}" --model "${modelId}" --output "${outputPath}"`;

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    if (fs.existsSync(outputPath)) {
      const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
      console.log(`  OK → ${path.basename(outputPath)} (${size}KB)`);
      return outputPath;
    }
    console.warn('  Aviso: arquivo não gerado');
    return null;
  } catch (err) {
    const msg = err.stderr?.toString()?.slice(0, 100) || err.message?.slice(0, 80) || 'erro desconhecido';
    console.warn(`  Fallback (${msg})`);
    return null;
  }
}

// ---------------------------------------------------------------
// GERA BACKGROUNDS PARA TODOS OS SLIDES DO BRIEFING
// ---------------------------------------------------------------
function generateBackgrounds(slides, topicTitle, model = 'free') {
  if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });

  const results = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const type = slide.type || (i === 0 ? 'capa' : i === slides.length - 1 ? 'cta' : 'corpo');
    const prompt = selectPrompt(type, topicTitle);
    const outPath = path.join(BG_DIR, `bg-slide-${i + 1}.png`);

    process.stdout.write(`  [${i + 1}/${slides.length}] bg-${type}... `);
    const result = generateImage(prompt, outPath, model);
    results.push(result);
  }
  return results;
}

// ---------------------------------------------------------------
// GERA POST COMPLETO (imagem pronta para postar)
// ---------------------------------------------------------------
function generateFullPost({ hook, body, label, format, type, outputPath, model = 'free' }) {
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  const out = outputPath || path.join(POSTS_DIR, `post-${Date.now()}.png`);

  let prompt;
  if (type === 'motivacional') {
    prompt = FULL_POST_PROMPTS.motivacional(hook, body);
  } else if (format === 'carousel' || type === 'capa') {
    prompt = FULL_POST_PROMPTS.carousel_cover(hook, label);
  } else {
    prompt = FULL_POST_PROMPTS.educational(hook, body, label);
  }

  console.log(`  Gerando post completo: ${format || 'feed'} (${type || 'educativo'})`);
  return generateImage(prompt, out, model);
}

// ---------------------------------------------------------------
// CLI
// ---------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

  const mode = get('--mode') || 'background';
  const model = get('--model') || 'free';

  if (mode === 'full-post') {
    const hook = get('--hook') || '3 ERROS QUE FAZEM SEU CONTEÚDO NÃO CONVERTER';
    const body = get('--body') || '';
    const label = get('--label') || 'CF_001 / MARKETING';
    const format = get('--format') || 'feed';
    const type = get('--type') || 'educativo';
    const output = get('--output') || path.join(POSTS_DIR, `post-test.png`);

    if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
    const result = generateFullPost({ hook, body, label, format, type, outputPath: output, model });
    console.log(result ? `Post gerado: ${result}` : 'Falhou');

  } else {
    // modo background
    const topic = get('--topic') || 'marketing';
    const slideType = get('--slide-type') || 'corpo';
    const output = get('--output') || path.join(BG_DIR, `bg-test.png`);

    if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });
    const prompt = selectPrompt(slideType, topic);
    process.stdout.write(`Gerando bg (${slideType}/${topic})... `);
    const result = generateImage(prompt, output, model);
    console.log(result ? `Salvo: ${result}` : 'Falhou');
  }
}

module.exports = { generateImage, generateBackgrounds, generateFullPost, SLIDE_PROMPTS, FULL_POST_PROMPTS };
