---
task: Define Content Pillars
responsavel: '@content-strategist'
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - brand_voice: Brand tone and personality (e.g., "educational, warm, bold")
  - niche: Industry/niche (e.g., "fitness coaching", "SaaS for SMBs")
  - target_audience: Audience profile
  - competitors: List of 3-5 competitor handles to differentiate from
Saida: |
  - content_pillars: 3-5 defined content pillars with descriptions
  - pillar_ratios: Posting frequency per pillar (% or posts/week)
  - content_types_per_pillar: Content format recommendations per pillar
Checklist:
  - '[ ] Analyze brand_voice and niche'
  - '[ ] Research competitor content gaps'
  - '[ ] Define 3-5 content pillars (avoid copying competitors)'
  - '[ ] Assign posting ratio to each pillar'
  - '[ ] Define 2-3 content types per pillar'
  - '[ ] Validate pillars cover awareness + trust + conversion funnel stages'
---

# define-content-pillars

Define 3-5 content pillars that represent the brand's core themes, ensuring coverage across the full marketing funnel.

## Pillar Framework

Every brand needs pillars that cover all 3 funnel stages:

```
AWARENESS (Top): Attracts new audiences — educational, entertaining, trending
TRUST (Middle): Builds credibility — behind-the-scenes, proof, stories
CONVERSION (Bottom): Drives action — offers, testimonials, CTAs
```

## Common Pillar Archetypes

| Pillar Type | Content Examples | Funnel Stage |
|-------------|-----------------|--------------|
| Education | Tips, How-tos, Tutorials | Awareness |
| Entertainment | Memes, Trending sounds, Challenges | Awareness |
| Inspiration | Transformations, Quotes, Stories | Awareness/Trust |
| Behind-the-scenes | Process, Team, Day-in-life | Trust |
| Social Proof | Testimonials, Results, UGC | Trust/Conversion |
| Promotion | Offers, Products, Services | Conversion |

## Recommended Pillar Ratios

```
Educational/Value: 40%
Entertainment/Engagement: 30%
Trust/Social Proof: 20%
Promotional/CTA: 10%
```

## Output Format

```markdown
## Content Pillars — [Brand Name]

### Pillar 1: [Name] — [X]% of content
**Theme:** [Description]
**Why it works:** [Strategic reason]
**Content types:** Reels, Carousels, Stories
**Example topics:** [3 examples]

### Pillar 2: [Name] — [X]%
...
```
