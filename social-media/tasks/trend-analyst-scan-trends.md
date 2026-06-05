---
task: Scan Trends
version: 2.0.0
responsavel: '@trend-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - platforms: Platforms to scan (instagram/tiktok/youtube/linkedin)
  - niches: Brand niches to focus on
  - time_window: How recent (24h/48h/7d)
  - competitor_list: Optional list of competitor accounts to monitor
Saida: |
  - trending_topics: List of trending topics with urgency level
  - trending_formats: Currently performing video/post formats
  - viral_hooks_detected: Hook patterns from viral content this week
Checklist:
  - '[ ] Execute mandatory WebSearch queries (minimum 3) — see Execution Protocol below'
  - '[ ] WebFetch at least 2 full articles from top results'
  - '[ ] Identify top trending topics in niche from live search results'
  - '[ ] Identify trending formats (listicle, storytime, POV, etc.) from live data'
  - '[ ] Classify trends by urgency (immediate/this-week/this-month)'
  - '[ ] Extract 3-5 viral hook patterns from trending content found via WebSearch'
  - '[ ] Filter by brand relevance (Carbon Films)'
  - '[ ] Output structured handoff to content-strategist and copy-writer'
---

# scan-trends

Monitor and categorize current trends across social media platforms to identify content opportunities.
**CRITICAL:** All trend data MUST come from live WebSearch queries — never guess or use memory alone.

## Execution Protocol — WebSearch Required

This task MUST execute web research before producing any output. Follow these steps in order:

### Step 1 — Execute Mandatory Search Queries

Run each query via WebSearch:

```
Query 1: "tendencias instagram reels {month} {year} marketing digital brasil"
         → Captures current IG trends in the Brazilian marketing niche

Query 2: "trending tiktok marketing agencias {month} {year}"
         → TikTok trends relevant to agencies

Query 3: "viral instagram {current_week} brasil pequenas empresas"
         → What's going viral on IG this week for SMBs (Carbon Films' audience)

Query 4 (if platforms includes youtube/linkedin):
         "tendencias {platform} marketing {month} {year} brasil"
         → Platform-specific trends
```

**Minimum:** 3 queries always. If `time_window = 24h`, add:
```
Query bonus: "{niches[0]} viral social media hoje {current_date}"
             → Ultra-fresh signal for same-day content
```

### Step 2 — WebFetch Top Articles

After WebSearch, pick the 2 most relevant URLs from results and execute WebFetch on each.
Extract:
- Publication date (reject if older than `time_window`)
- Specific trend names, formats, or sounds mentioned
- Engagement numbers cited (views, likes, shares)

### Step 3 — Competitor Spot Check (if competitor_list provided)

```
Query: "{competitor_handle} instagram recent posts {month} {year}"
       → See what competitors are posting about right now
```

### Step 4 — Synthesize and Classify

Combine all WebSearch + WebFetch results. Classify each finding:

```
🔴 IMMEDIATE (use within 24-48h): Breaking trend, fast-moving
🟡 THIS WEEK: 3-7 day window, solid opportunity
🟢 THIS MONTH: Emerging trend, time to build content
⚪ EVERGREEN: Ongoing theme, no urgency but consistent demand
```

---

## Trend Categories

```
TOPICS: Subjects people are talking about (news, events, conversations)
FORMATS: Video/post styles that are spreading (challenge, storytime, POV)
SOUNDS: Audio tracks being used virally on Reels/TikTok
HASHTAGS: Tags gaining momentum this week
AESTHETICS: Visual styles trending in your niche
```

## Output Format

```markdown
## Trend Scan — [platforms] — [date]
**Data source:** WebSearch queries executed: [list queries used]
**Articles fetched:** [list URLs]

### Trending Topics
| Topic | Urgency | Platforms | Brand Fit (1-5) | Source |
|-------|---------|-----------|-----------------|--------|
| [topic] | 🔴 | IG, TT | 4 | [URL or publication] |

### Trending Formats
| Format | Description | Urgency | How to Use | Source |
|--------|-------------|---------|-----------|--------|
| [format] | [desc] | 🟡 | [how] | [URL] |

### Viral Hook Patterns This Week
1. "[Hook formula]" — Found in [X] viral posts — Source: [URL]
2. "[Hook formula]" — Trending in [niche] — Source: [URL]

### Recommended Immediate Actions
1. [Action] — Deadline: [date] — Based on: [source]
2. [Action] — Deadline: [date] — Based on: [source]

---
TREND HANDOFF — Pulse → content-strategist
Date: {date}
Top trend: {name} | Urgency: immediate/week/month
Carbon Films angle: {specific angle}
Suggested format: {reel/carousel/stories}
Hook suggestion: {hook text}
---
```

## Quality Gates

- **QG-SCAN-001 — Live Data Required:** Output is INVALID if no WebSearch was executed. Every trend listed must have a source URL or search query reference.
- **QG-SCAN-002 — Freshness:** All HOT (🔴) trends must come from content published within the `time_window`. Reject stale signals.
- **QG-SCAN-003 — Minimum Queries:** At least 3 WebSearch queries must be logged in the output header.
- **QG-SCAN-004 — Brand Filter:** Every trend in the output must include a Brand Fit score (1-5). Trends scoring 1-2 are excluded from recommendations.
- **QG-SCAN-005 — Handoff Complete:** Output must include the structured TREND HANDOFF block for downstream agents.
