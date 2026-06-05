# Social Media Squad — Carbon Films

AI-driven social media content squad para criação de conteúdo viral, gestão de calendário editorial, produção de vídeo e monitoramento de performance. **Versão 4.0** inclui o Quality Gate (Vera) — aprovação autônoma substituindo revisão manual.

---

## Agents

| Agent | Name | Model | Role |
|-------|------|-------|------|
| `content-strategist` | Nova | Opus 4.6 | Orchestrator — strategy, calendar, squad coordination |
| `copy-writer` | Lyra | Sonnet 4.6 | Viral copy, hooks, captions, hashtags, CTAs |
| `video-specialist` | Cleo | Sonnet 4.6 | Video briefs, reel formats, editing scripts, audio trends |
| `trend-analyst` | Pulse | Sonnet 4.6 | Trend monitoring, viral patterns, competitor analysis |
| `scheduler` | Rhythm | Sonnet 4.6 | Post scheduling, daily/weekly checklists, calendar |
| `performance-analyst` | Echo | Haiku 4.5 | Metrics monitoring, anomaly detection, reports |
| `whatsapp-orchestrator` | Kai | Sonnet 4.6 | WhatsApp intake & approval flow orchestrator |
| `canva-designer` | Pixel | Sonnet 4.6 | Visual production via Canva API |
| `remotion-editor` | Remi | Sonnet 4.6 | Video editing via Remotion |
| **`quality-inspector`** | **Vera** | **Opus 4.6** | **Quality Gate — avaliação autônoma e aprovação final** |

---

## Workflow v2.0 — Com Quality Gate

```
PESQUISA (Pulse)
    ↓
ROTEIRO (Nova + Lyra)
    ↓ [human checkpoint: foto/vídeo]
PRODUÇÃO (Pixel/Remi)
    ↓
QUALITY GATE (Vera) ←── substitui aprovação manual
    ├── APPROVED → POSTAGEM (Rhythm) → MÉTRICAS (Echo)
    └── REJECTED → volta para PRODUÇÃO com feedback cirúrgico
         (máximo 3 iterações antes de escalar para humano)
```

### Como o Quality Gate funciona

Vera avalia cada peça de conteúdo em 5 dimensões com pesos distintos:

| Dimensão | Peso | O que avalia |
|----------|------|-------------|
| Impacto | 30% | O hook para o scroll? |
| Marca | 25% | 100% alinhado com o brandbook Carbon Films? |
| Copy | 20% | Progressão hook → corpo → CTA? |
| Visual | 15% | Design premium, safe zones, dimensões? |
| Estratégia | 10% | Conteúdo certo, hora certa, pilar certo? |

**Score >= 3.5** → APPROVED e vai automaticamente para postagem
**Score < 3.5** → REJECTED com feedback específico e volta para o agente responsável
**3 rejeições** → escalona para revisão humana com relatório completo

---

## Communication Flow

```
content-strategist (Nova) — ORCHESTRATOR
    ├──→ trend-analyst (Pulse) — Intelligence first
    │        └──→ feeds copy-writer + video-specialist
    ├──→ copy-writer (Lyra) — Caption, hook, hashtag, CTA
    ├──→ video-specialist (Cleo) — Brief, format, script, audio
    ├──→ canva-designer (Pixel) — Visual production
    ├──→ remotion-editor (Remi) — Video editing
    ├──→ quality-inspector (Vera) — FINAL GATE (substitui humano)
    ├──→ scheduler (Rhythm) — Calendar, daily/weekly checklists
    └──→ performance-analyst (Echo) — Monitors all, reports back
```

---

## Quick Start

### 1. Activate the orchestrator

```
/social-media:content-strategist
```

### 2. Run the full automated pipeline

```bash
node scripts/run-workflow.js carousel --topic "seu tema aqui"
```

### 3. Or activate the quality inspector directly

```
/social-media:quality-inspector
*final-gate
```

---

## Individual Agent Commands

### Content Strategist (Nova)
```
*set-objective              — Define KPIs and platform priorities
*define-content-pillars     — Define 3-5 content pillars with ratios
*create-editorial-calendar  — Create monthly content calendar
*orchestrate                — Run full squad for the week
*weekly-review              — Analyze last week and adjust strategy
```

### Copy Writer (Lyra)
```
*write-caption              — Write platform-optimized caption
*create-hook                — Create viral opening hook (5 variations)
*generate-hashtags          — Generate strategic hashtag set
*create-cta                 — Create compelling call-to-action
*write-variations           — Generate copy A/B test variations
```

### Video Specialist (Cleo)
```
*create-video-brief         — Create complete video production brief
*define-reel-format         — Define format spec for a content type
*suggest-trending-audio     — Suggest trending audio tracks
*create-editing-script      — Write frame-by-frame editing script
*review-video-content       — Quality review before publishing
```

### Trend Analyst (Pulse)
```
*scan-trends                — Scan trending topics and formats
*analyze-viral-patterns     — Extract replication formula from viral content
*competitor-analysis        — Analyze competitor gaps and opportunities
*trend-report               — Weekly trend intelligence report
*suggest-content-from-trends — Branded content ideas from current trends
```

### Scheduler (Rhythm)
```
*schedule-post              — Schedule a post at optimal time
*daily-checklist            — Generate today's operations checklist
*weekly-checklist           — Generate weekly production checklist
*optimize-posting-times     — Analyze and optimize posting schedule
*generate-content-calendar  — Visual content calendar from editorial plan
```

### Performance Analyst (Echo)
```
*collect-metrics            — Collect engagement data from platforms
*analyze-engagement         — Analyze performance vs KPI targets
*detect-anomaly             — Detect performance spikes or drops
*generate-report            — Weekly performance report
*send-alert                 — Alert team to anomalies
```

### **Quality Inspector (Vera) — NOVO**
```
*final-gate                 — Avaliação completa (5 dimensões) e veredicto final
*review-copy                — Revisar somente copy e caption
*review-visual              — Revisar somente visual e brandbook
*approve-content            — Registrar aprovação e autorizar postagem
*reject-content             — Registrar rejeição e devolver com feedback
```

### WhatsApp Orchestrator (Kai)
```
*receive-command            — Process incoming WhatsApp message with photo + command
*execute-pipeline           — Run full 4-mindclone pipeline for a command
*send-preview               — Assemble and send preview package to WhatsApp
*handle-approval            — Process approval or adjustment request
```

### Canva Designer (Pixel)
```
*generate-design            — Generate design from visual briefing
*apply-branding             — Apply brandbook rules to existing template
*export-format              — Export in correct dimensions/format for platform
*check-safe-zones           — Validate text/elements are in safe zones
*create-carousel-slides     — Generate multi-slide carousel design
```

---

## Checklists

| Checklist | Frequency | Responsible | Command |
|-----------|-----------|-------------|---------|
| `daily-post-checklist.md` | Every day | Scheduler | `*daily-checklist` |
| `weekly-content-checklist.md` | Every Monday | Scheduler | `*weekly-checklist` |
| `quality-gate-checklist.md` | Every content piece | Quality Inspector | `*final-gate` |

---

## Templates

| Template | Format | Use Case |
|----------|--------|----------|
| `post-templates/reels.yaml` | 9:16 video | Reels, TikTok, Shorts |
| `post-templates/carousel.yaml` | Image slides | Educational, listicles |
| `post-templates/static.yaml` | Single image | Quotes, announcements |
| `post-templates/stories.yaml` | 9:16 ephemeral | Polls, BTS, promos |
| `post-templates/feed.yaml` | 4:5 portrait | Feed impactante |
| `templates/carrossel-carbon-films.html` | HTML componentizado | Geração via Playwright (1080x1350) |
| `templates/video-templates/*.yaml` | Video briefs | Stickman, reels concept |

### Template HTML Componentizado (Carousel)

O arquivo `templates/carrossel-carbon-films.html` é o template visual oficial para carrosséis gerados via Playwright:

- **Dimensões:** 1080×1350px (Instagram Feed 4:5)
- **Temas:** Dark (`#000`) e White (`#fff`) — alternância automática
- **IDs injetáveis:**
  - Dark: `slide1`-`slide5` → `s1-title`, `s1-body`, `s2-title`, `s2-body`...
  - White: `ws1`-`ws5` → mesma estrutura com prefixo `ws`
- **Fontes:** DM Sans (Google Fonts)
- **Pipeline:** `scripts/generate-slides-html.js` → `scripts/capture-slides.js`

---

## Data Reference

| File | Description |
|------|-------------|
| `data/best-posting-times.json` | Optimal posting windows by platform and niche |
| `data/viral-hooks-library.yaml` | 50+ proven hook formulas by trigger type |
| `data/content-pillars-framework.yaml` | Pillar archetypes, ratios, and scoring |
| `data/brandbook-carbon-films.yaml` | Carbon Films brandbook completo |
| `data/mind-council-frameworks.yaml` | Frameworks dos 4 especialistas |
| `data/instagram-benchmarks.yaml` | Benchmarks BR 2025-2026 |
| `data/commands-library.yaml` | 9 /commands com pipelines mapeados |
| `data/technical-specs.yaml` | Dimensões por formato e plataforma |
| `data/quality-approvals.json` | Registro de conteúdos aprovados por Vera |
| `data/quality-rejections.json` | Registro de rejeições com motivos |

---

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/run-workflow.js` | Pipeline completo: pesquisa → copy → design → quality gate → instagram |
| `scripts/generate-slides-html.js` | Gerador HTML com suporte a temas dark/white |
| `scripts/capture-slides.js` | Captura Playwright (1080x1350px) |
| `scripts/instagram-post.js` | Postagem via Meta Graph API |
| `scripts/scheduler.js` | Scheduler CLI com agenda semanal |
| `scripts/health-check.js` | Diagnóstico de saúde de todos os agentes |
| `scripts/agent-runner.js` | Runner de agentes com Claude API |

---

## Environment Variables

Crie um arquivo `.env` na raiz do squad:

```bash
META_ACCESS_TOKEN=EAAalWDEiUaQ...
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400874017740
APIFY_TOKEN=apify_api_...
ANTHROPIC_API_KEY=sk-ant-...
CANVA_CLIENT_ID=OC-AZzty6z...
CANVA_CLIENT_SECRET=...
OPENROUTER_API_KEY=...
IMGUR_CLIENT_ID=546c25a59c58ad7
```

---

## MVP Deployment Sequence

| Phase | Agents | Rationale |
|-------|--------|-----------|
| 1 | `trend-analyst` + `performance-analyst` | Intelligence foundation |
| 2 | `copy-writer` + `scheduler` | Core production pipeline |
| 3 | `video-specialist` + `canva-designer` | Production layer |
| 4 | `content-strategist` | Full orchestration |
| 5 | `quality-inspector` | Quality Gate autonomy |
| 6 | `whatsapp-orchestrator` | Zero-edit human workflow |

---

## Supported Platforms

- Instagram (Reels, Carousels, Static, Stories)
- TikTok
- YouTube Shorts
- LinkedIn

---

*Squad version 4.0.0 — Synkra AIOX*
*Quality Gate: Vera (quality-inspector) — aprovação autônoma sem intervenção humana*
