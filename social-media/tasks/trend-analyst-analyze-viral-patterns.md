---
task: Analyze Viral Patterns
version: 2.0.0
responsavel: '@trend-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - viral_posts_sample: Optional — description or list of known viral posts in the niche (can be empty; agent will search live)
  - engagement_thresholds: What counts as viral (e.g., >100K views, >5K likes)
  - platforms: Platforms to analyze
  - niche: Brand niche to focus analysis on (defaults to Carbon Films niches)
Saida: |
  - pattern_report: Common patterns found in viral content
  - common_elements: Elements present in most viral posts
  - replication_formula: Step-by-step formula to replicate virality
Checklist:
  - '[ ] Execute WebSearch to find current viral content examples — do not rely solely on viral_posts_sample input'
  - '[ ] WebFetch at least 1 article with viral analysis or case study'
  - '[ ] Identify common hook structures from live examples'
  - '[ ] Identify common emotional triggers'
  - '[ ] Map content structure (beginning/middle/end patterns)'
  - '[ ] Note visual/audio elements that recur'
  - '[ ] Build replication formula from patterns with Carbon Films application'
---

# analyze-viral-patterns

Reverse-engineer viral content to extract a replication formula the squad can systematically apply.
**CRITICAL:** Always complement input data with live WebSearch. Viral patterns shift week to week — stale analysis leads to missed opportunities.

## Execution Protocol — WebSearch Required

### Step 1 — Search for Current Viral Examples

Even if `viral_posts_sample` was provided, always run live searches to validate and enrich:

```
Query 1: "viral instagram reels {niche} {month} {year} exemplos"
         → Find real viral examples in the niche right now

Query 2: "why is this video going viral {platform} {month} {year} analysis"
         → Find pattern analysis from practitioners

Query 3: "hook formulas viral instagram 2026 agencias marketing"
         → Curated hook formulas relevant to Carbon Films' content
```

If `platforms` includes TikTok:
```
Query 4: "tiktok viral formula marketing {month} {year}"
```

### Step 2 — WebFetch a Viral Analysis Article

Pick the most detailed article from WebSearch results and WebFetch it.
Look for:
- Specific hook phrases used in viral posts
- Video structure breakdown (seconds by seconds)
- Engagement patterns (saves vs shares vs comments)
- Platform algorithm factors cited

### Step 3 — Pattern Extraction

Cross-reference live examples + article data against `viral_posts_sample` (if provided).
Fill the Pattern Analysis Framework:

```
WHAT makes people stop?     → Hook analysis (first 3 seconds)
WHAT keeps them watching?   → Pacing, value, entertainment
WHAT makes them share?      → Emotional peak, relatability, usefulness
WHAT makes them save?       → Reference value, transformation promise
WHAT makes them comment?    → Opinion trigger, question, controversy
```

---

## Output Format

```markdown
## Viral Pattern Report — [niche] — [date]
**Data source:** WebSearch queries: [list] | WebFetch URLs: [list]
**Posts analyzed:** [N from input] + [N from web research]

### Common Hook Structures
1. [Pattern] — Found in [X]% of analyzed posts — Example: "[real example from search]"
2. [Pattern] — Found in [X]%

### Common Emotional Triggers
1. [Trigger] — [How it appears in content] — Source: [URL or post]

### Content Structure Pattern
[% of viral posts follow this structure]:
- Opening: [X seconds] — [description]
- Body: [X seconds] — [description]
- Peak moment: [X seconds] — [description]
- Close: [X seconds] — [description]

### Visual/Audio Elements
- [Element]: present in [X]% of viral posts — Source: [URL]

### Replication Formula for Carbon Films

Step 1: [action] — [reason from data]
Step 2: [action] — [reason from data]
Step 3: [action] — [reason from data]
Step 4: [action] — [reason from data]

**Confidence score:** [X]% (based on [N] posts analyzed — [N] from live web data)

### Carbon Films Application
Specific adaptation of the formula above for Carbon Films' brand voice and niches:
- Best performing niche to apply this: [niche]
- Recommended first test format: [reel/carousel/feed]
- Suggested hook starter: "[hook text based on patterns found]"
```

## Quality Gates

- **QG-VIRAL-001 — Live Validation:** Patterns must be validated against content found via WebSearch, not only against `viral_posts_sample` input. If only input was used, flag output as `unvalidated`.
- **QG-VIRAL-002 — Recency:** At least one WebSearch result or article must be from the current month. Discard pattern data older than 60 days unless classified as `evergreen`.
- **QG-VIRAL-003 — Carbon Films Application:** Output must include a Carbon Films-specific replication section — generic formulas without brand adaptation are incomplete.
