---
task: Generate Trend Report
version: 2.0.0
responsavel: '@trend-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - scan_data: Output from scan-trends task
  - viral_patterns: Output from analyze-viral-patterns task
  - period: Report period (weekly/monthly)
Saida: |
  - weekly_trend_report: Full trend intelligence report in MD
  - actionable_recommendations: Prioritized content actions
  - urgency_level: Overall urgency (high/medium/low)
Checklist:
  - '[ ] Verify scan_data was generated with live WebSearch (check for source URLs in scan_data)'
  - '[ ] If scan_data has no WebSearch sources, run scan-trends task first before generating report'
  - '[ ] Run 1-2 WebSearch queries to enrich report with any emerging signals since scan_data was collected'
  - '[ ] Compile scan_data into structured report'
  - '[ ] Add viral_patterns section'
  - '[ ] Prioritize recommendations by urgency'
  - '[ ] Output report in ready-to-share markdown format with source references'
---

# trend-report

Compile all trend intelligence into a weekly report for the content-strategist and squad.

## Data Quality Gate — Before Compiling

Check `scan_data` for the following signal of web-backed quality:
- Does it contain source URLs or WebSearch query references? → Proceed
- Does it lack any URL references? → **Run `scan-trends` first** before generating this report

Optionally enrich the report with a freshness query:
```
Query: "marketing digital tendencias {current_week} brasil"
       → Catch any signals that emerged between scan and report generation
```

## Output Format

```markdown
# Weekly Trend Report — Week [N] — [dates]
**Prepared by:** Pulse (Trend Analyst)
**Urgency Level:** 🔴 High / 🟡 Medium / 🟢 Low

---
## Executive Summary
[2-3 sentences: what's the single biggest trend opportunity this week]

## Top Trends by Platform

### Instagram
1. [Trend] — Urgency: 🔴 — Content angle: [angle]
2. [Trend] — Urgency: 🟡

### TikTok
...

## Viral Pattern of the Week
[Description of pattern] — How to apply: [instruction]

## Recommended Content Actions
| Priority | Action | Format | Deadline |
|----------|--------|--------|----------|
| 1 | [action] | Reel | [date] |
| 2 | [action] | Carousel | [date] |

## Fading Trends to Avoid
- [Trend] — Past peak, skip it

## Next Week Watch List
- [Topic to monitor] — Could break by [date]
```
