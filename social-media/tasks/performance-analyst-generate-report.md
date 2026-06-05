---
task: Generate Performance Report
responsavel: '@performance-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - engagement_report: Output from analyze-engagement
  - period: Report period (weekly/monthly)
  - audience: Report audience (internal team / client / executive)
Saida: |
  - performance_report_md: Complete formatted performance report
  - summary_stats: Key numbers at a glance
  - recommendations: 3-5 data-driven recommendations
---

# generate-report

Generate a structured performance report tailored for the intended audience.

## Report Formats by Audience

| Audience | Format | Depth |
|----------|--------|-------|
| Internal team | Detailed markdown | Full data + diagnosis |
| Client | Clean summary | KPIs + top wins + next steps |
| Executive | 1-page summary | 3 numbers + 1 insight |

## Output Format (Internal Weekly)

```markdown
# Performance Report — Week [N] — [dates]
**Brand:** [brand] | **Prepared by:** Echo (Performance Analyst)
**Generated:** [date]

---
## KPI Summary
| Metric | This Week | Last Week | WoW | vs Target |
|--------|-----------|-----------|-----|-----------|
| Total Reach | [X] | [X] | [+/-X]% | [status] |
| Avg Eng Rate | [X]% | [X]% | [+/-X]pp | [status] |
| Total Saves | [X] | [X] | [+/-X]% | [status] |
| New Followers | +[X] | +[X] | [+/-X]% | [status] |
| Posts Published | [X] | [X] | — | [status] |

---
## Platform Breakdown
### Instagram: [overall status ✅/⚠️/❌]
[Key numbers and 1 insight]

### TikTok: [status]
[Key numbers and 1 insight]

---
## Top Post of the Week
[Post title] on [platform] — [date]
Reach: [X] | Eng Rate: [X]% | Saves: [X]
Why it won: [insight]

---
## Recommendations
1. [Recommendation] — Based on: [data signal]
2. [Recommendation] — Based on: [data signal]
3. [Recommendation] — Based on: [data signal]
```
