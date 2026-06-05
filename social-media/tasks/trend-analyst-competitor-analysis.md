---
task: Competitor Analysis
version: 2.0.0
responsavel: '@trend-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - competitor_handles: List of competitor social media accounts (optional — agent will search if not provided)
  - platforms: Platforms to analyze
  - analysis_period: Time period (last 30d / 90d)
Saida: |
  - competitor_report: Summary of each competitor's content strategy
  - content_gaps: Topics/formats competitors aren't covering
  - opportunity_map: Specific opportunities based on gap analysis
Checklist:
  - '[ ] Execute WebSearch to identify and research competitor accounts'
  - '[ ] Search for each competitor handle or find top competitors if list not provided'
  - '[ ] WebFetch at least 1 competitor profile or strategy article'
  - '[ ] Analyze posting frequency per competitor'
  - '[ ] Identify top-performing content types per competitor'
  - '[ ] Map content pillars being used by each competitor'
  - '[ ] Identify gaps (topics missing from all competitors)'
  - '[ ] Build opportunity map from gaps with Carbon Films positioning'
---

# competitor-analysis

Analyze competitor social media strategies to identify gaps and opportunities.
**CRITICAL:** Use WebSearch to research competitors live — never assume competitor strategy without checking current data.

## Execution Protocol — WebSearch Required

### Step 1 — Identify Competitors (if competitor_handles not provided)

```
Query 1: "agencias marketing digital {city/region} instagram {year}"
         → Find who Carbon Films competes with locally (SC/Florianópolis)

Query 2: "agencias marketing digital brasil instagram mais seguidos {year}"
         → Benchmark against top national agencies

Query 3: "carbon films concorrentes marketing visual SC"
         → Direct competitor discovery
```

If `competitor_handles` was provided, skip to Step 2.

### Step 2 — Research Each Competitor

For each competitor account, run:

```
Query: "{competitor_handle} instagram estrategia conteudo {month} {year}"
       → Recent content strategy signals for this competitor

Query: "{competitor_handle OR competitor_name} social media top posts"
       → What's performing best for them right now
```

WebFetch competitor profiles or articles about them when URLs are available.

### Step 3 — Gap Analysis via Search

After profiling competitors, identify what they collectively avoid:

```
Query: "{niche} conteudo subutilizado agencias marketing instagram 2026"
       → Industry perspective on unexplored content angles

Query: "marketing audiovisual SC tendencias {year} oportunidades"
       → Regional opportunities Carbon Films could own
```

---

## Analysis Framework

```
What they post (content types, pillars)
How often they post (frequency, consistency)
What performs best (top posts by engagement)
What they NEVER post (the gap — your opportunity)
How the audience responds (comment themes, questions asked)
```

## Output Format

```markdown
## Competitor Analysis — [platform] — [period]
**Research method:** WebSearch + WebFetch
**Queries executed:** [list]
**Date:** [current date]

### Competitor Overview
| Account | Followers | Posts/Week | Avg Engagement | Top Format | Source |
|---------|-----------|-----------|----------------|-----------|--------|
| @[handle] | [X]K | [X] | [X]% | [format] | [URL] |

### Top Performing Content by Competitor
**@[handle]:**
- Best post type: [type] — Source: [URL or query]
- Most engaging topic: [topic]
- Hook pattern: [pattern]

### Content Gap Map
Topics NOT covered by any competitor (from web research):
1. [Topic] — Opportunity size: [High/Medium/Low] — Source: [how found]
2. [Topic] — First mover advantage: [Yes/No]

Formats underutilized (vs best practices found via WebSearch):
1. [Format] — Competitors using it: [X/total] — Gap significance: [High/Med/Low]

### Carbon Films Opportunity Map
| Opportunity | Type | Urgency | Action | Competitive Advantage |
|-------------|------|---------|--------|-----------------------|
| [opp] | Topic gap | High | Create carousel on [topic] | First mover in SC |

### Recommended First Moves
1. [Action] — Expected advantage: [description] — Based on: [source]
2. [Action] — Expected advantage: [description]

### Data Confidence
- Competitor data freshness: [date of most recent data point]
- Search coverage: [N] queries + [N] URLs fetched
- Gaps confirmed by: [method — web research / pattern analysis]
```

## Quality Gates

- **QG-COMP-001 — No Assumptions:** Do not profile a competitor without running at least 1 WebSearch query about them. Flag any competitor listed without a source URL as `unverified`.
- **QG-COMP-002 — Gap Validation:** Content gaps must be confirmed by web research (not assumed). Each gap entry must reference the search query or source that revealed it.
- **QG-COMP-003 — Carbon Films Positioning:** The opportunity map must explicitly state Carbon Films' competitive advantage for each opportunity identified.
- **QG-COMP-004 — Recency:** Competitor data must be from the last `analysis_period`. Older data can be noted as historical context but not used as current positioning.
