---
task: Set Content Objectives
responsavel: '@content-strategist'
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - brand_name: Brand/client name
  - target_audience: Primary audience profile (age, interests, pain points)
  - platforms: Target platforms (instagram, tiktok, youtube, linkedin)
  - business_goal: Business objective (e.g., "grow followers 20%", "generate 50 leads/month")
  - monthly_budget: Budget for content production (optional)
Saida: |
  - content_objectives: Clear content goals per platform
  - kpi_targets: Specific measurable KPIs (reach, engagement rate, saves, followers)
  - platform_priorities: Ranked list of platforms with rationale
Checklist:
  - '[ ] Confirm brand_name and target_audience'
  - '[ ] Map business_goal to content KPIs'
  - '[ ] Define KPI targets per platform (reach, engagement, saves, followers)'
  - '[ ] Rank platforms by strategic priority'
  - '[ ] Document content_objectives in structured format'
  - '[ ] Get approval from human strategist'
---

# set-objective

Define clear content objectives and measurable KPIs for the brand across all target platforms.

## Objective Framework

```
Business Goal → Content Goal → KPI
────────────────────────────────────
"Grow brand awareness" → More reach → Impressions, Reach, Followers
"Generate leads" → Traffic + Trust → Link clicks, Saves, DMs
"Sell product" → Conversion → Link clicks, Story swipes, CTA clicks
"Build community" → Engagement → Comments, Shares, DMs, UGC
```

## Platform Priority Matrix

| Platform | Strength | Best For |
|----------|----------|----------|
| Instagram | Visual brand, Reels discovery | Brand awareness, Products |
| TikTok | Organic reach, Virality | Discovery, Young audience |
| YouTube | Long-form, SEO | Authority, Education |
| LinkedIn | B2B, Professional | Lead gen, Thought leadership |

## KPI Benchmarks (Reference)

| Platform | Good Engagement Rate | Good Reach Rate |
|----------|---------------------|-----------------|
| Instagram | >3% | >10% of followers |
| TikTok | >5% | Organic (no follower threshold) |
| YouTube | >4% | Impressions click-through >5% |
| LinkedIn | >2% | Impressions >500/post |

## Output Format

```markdown
## Content Objectives — [Brand Name]
**Period:** [Month/Year]
**Business Goal:** [stated goal]

### Platform Priorities
1. [Platform 1] — [rationale]
2. [Platform 2] — [rationale]

### KPI Targets
| KPI | Target | Platform | Measurement |
|-----|--------|----------|-------------|
| Reach | X | All | Monthly avg |
| Engagement Rate | X% | Instagram | Per post avg |
| Follower Growth | X | All | Monthly net |
| Saves | X | Instagram | Monthly total |
```
