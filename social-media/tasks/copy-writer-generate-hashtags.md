---
task: Generate Hashtags
version: 2.0.0
responsavel: '@copy-writer'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - post_topic: Topic of the post
  - platform: Target platform (instagram/tiktok/linkedin)
  - niche: Brand niche/industry
  - reach_target: Audience size target (small=local/niche, medium=growing, large=viral)
Saida: |
  - hashtag_set: Ready-to-paste hashtag set
  - mix_breakdown: How many of each type (niche/medium/broad)
  - estimated_reach: Estimated combined reach of the set
Checklist:
  - '[ ] Run WebSearch to verify which hashtags are currently active and trending for the topic'
  - '[ ] Check for banned/shadowbanned hashtags via WebSearch before including any'
  - '[ ] Generate mix of niche (low competition), medium, and broad hashtags based on live data'
  - '[ ] Match hashtag count to platform best practices'
  - '[ ] Include branded hashtag if brand has one'
  - '[ ] Output as ready-to-paste block'
---

# generate-hashtags

Generate a strategic hashtag set that maximizes discoverability without triggering algorithm penalties.
**NOTE:** Always verify hashtag relevance and status via WebSearch — banned hashtags and fading trends change frequently.

## WebSearch Step (Required for Accuracy)

Before generating the final set, run:

```
Query 1: "melhores hashtags {niche} instagram {month} {year}"
         → Current hashtag performance data for the niche

Query 2: "hashtags banidas instagram {year} lista"
         → Current banned hashtag list to cross-check and avoid
```

Use the results to:
- Confirm niche hashtags are still active (not dead or banned)
- Identify any new niche hashtags that emerged recently
- Validate estimated reach tiers against current data

## Platform Hashtag Strategy

| Platform | Ideal Count | Mix Strategy |
|----------|------------|--------------|
| Instagram | 5-15 | 30% niche, 40% medium, 20% broad, 10% branded |
| TikTok | 3-6 | Focus on trending + niche — broad kills algorithm |
| LinkedIn | 3-5 | Professional + industry + broad topic |

## Hashtag Tier System

```
TIER 1 — NICHE (< 100K posts): High relevance, low competition
TIER 2 — MEDIUM (100K–1M posts): Good reach, moderate competition
TIER 3 — BROAD (> 1M posts): High reach, very competitive
```

## Recommended Mix per Reach Target

| Reach Target | Tier 1 | Tier 2 | Tier 3 |
|-------------|--------|--------|--------|
| Small (niche) | 60% | 30% | 10% |
| Medium | 30% | 50% | 20% |
| Large (viral) | 20% | 40% | 40% |

## Common Hashtag Mistakes

- Using the same set on every post (algorithm flags this as spam)
- Using only mega-popular hashtags (content gets buried instantly)
- Using irrelevant hashtags (hurts engagement rate)
- Using banned hashtags (shadowban risk)

## Output Example

```
Hashtag Set for: [topic] on Instagram

NICHE (high relevance):
#marketingdigitalbrasil #copywriterbr #estrategiadigital

MEDIUM (good discovery):
#marketingdigital #copywriting #socialmedia

BROAD (volume play):
#marketing #negocios #empreendedorismo

BRANDED (if applicable):
#[brandname]

---
Mix: 4 niche | 4 medium | 3 broad | 1 branded = 12 total
Format: [paste-ready block below]

#marketingdigitalbrasil #copywriterbr #estrategiadigital #marketingdigital #copywriting #socialmedia #marketing #negocios #empreendedorismo #[brandname]
```
