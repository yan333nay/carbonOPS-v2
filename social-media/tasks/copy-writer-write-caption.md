---
task: Write Caption
responsavel: '@copy-writer'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - post_topic: What the post is about
  - content_pillar: Which pillar this belongs to (educational/entertainment/trust/promotional)
  - platform: Target platform (instagram/tiktok/linkedin)
  - tone: Desired tone (e.g., "casual and fun", "authoritative", "inspirational")
  - brand_voice: Brand personality traits
Saida: |
  - caption: Full ready-to-publish caption
  - character_count: Character count (must be within platform limits)
  - readability_score: Simple/Medium/Complex
Checklist:
  - '[ ] Open with strongest hook line'
  - '[ ] Match tone to platform and brand_voice'
  - '[ ] Include value/story in body'
  - '[ ] Add clear CTA at the end'
  - '[ ] Check character count vs platform limit'
  - '[ ] Add line breaks for readability (Instagram/TikTok)'
  - '[ ] Output 2 caption variations minimum'
---

# write-caption

Write a platform-optimized caption that stops the scroll and drives the desired action.

## Platform Caption Specs

| Platform | Max chars | Best length | Line breaks | Emojis |
|----------|-----------|-------------|-------------|--------|
| Instagram | 2,200 | 150-300 | Yes | Optional |
| TikTok | 2,200 | 100-150 | Minimal | Yes |
| LinkedIn | 3,000 | 300-600 | Yes | Minimal |
| YouTube | N/A | 500-1,000 | Yes | Minimal |

## Caption Structure

```
LINE 1: HOOK (stop the scroll)
[blank line]
LINES 2-4: VALUE/STORY (deliver the promise)
[blank line]
LINE 5: CTA (tell them what to do)
[blank line]
HASHTAGS (Instagram/TikTok only)
```

## Tone-to-Platform Matrix

| Tone | Instagram | TikTok | LinkedIn |
|------|-----------|--------|----------|
| Casual | ✅ Native | ✅ Native | ⚠️ Too informal |
| Authoritative | ✅ Works | ⚠️ Can feel stiff | ✅ Native |
| Inspirational | ✅ Native | ✅ Works | ✅ Works |
| Humorous | ✅ Works | ✅ Native | ⚠️ Use carefully |

## Output Example

```
Variation 1:
---
Você está cometendo esse erro todo dia sem perceber.

A maioria das pessoas acorda e faz exatamente isso que vai sabotar o dia todo.

→ Salva esse post e lê antes de dormir.

#produtividade #rotina #dicas
---

Variation 2:
---
O hábito mais subestimado das pessoas bem-sucedidas?

Não é acordar às 5h. Não é meditação. É isso aqui...

Comenta o que você acha abaixo 👇
---
```
