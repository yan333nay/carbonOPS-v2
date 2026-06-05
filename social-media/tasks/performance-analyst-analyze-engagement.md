---
task: Analyze Engagement
responsavel: '@performance-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - metrics_dataset: Raw metrics from collect-metrics
  - kpi_targets: KPI targets from content-strategist
  - period: Analysis period
Saida: |
  - engagement_report: Full engagement analysis
  - top_posts: Top 3 performing posts with insights
  - underperformers: Bottom 3 posts with diagnosis
  - trends: Week-over-week performance trends
---

# analyze-engagement

Analyze engagement data to surface actionable insights for the content-strategist.

## Engagement Rate Calculation

```
Engagement Rate = (Likes + Comments + Saves + Shares) / Reach × 100

Instagram benchmarks:
- <1%: Poor
- 1-3%: Average
- 3-6%: Good
- >6%: Excellent (viral territory)
```

## Output Format

```markdown
## Engagement Report — [period] — [brand]
**Prepared by:** Echo (Performance Analyst)

### Performance vs KPI Targets
| KPI | Target | Actual | Delta | Status |
|-----|--------|--------|-------|--------|
| Avg Reach | [X] | [Y] | [+/-Z] | ✅/⚠️/❌ |
| Avg Eng Rate | [X]% | [Y]% | [+/-Z] | ✅/⚠️/❌ |
| Total Saves | [X] | [Y] | [+/-Z] | ✅/⚠️/❌ |
| Follower Growth | +[X] | +[Y] | [+/-Z] | ✅/⚠️/❌ |

### Top 3 Posts
1. **[Post title]** — Eng Rate: [X]% | Reach: [X] | Saves: [X]
   Why it worked: [insight]

2. ...

### Bottom 3 Posts (Diagnosis)
1. **[Post title]** — Eng Rate: [X]%
   Likely issue: [weak hook / wrong posting time / wrong format for topic]

### Week-over-Week Trends
- Reach: [+/-X]% vs last week
- Engagement Rate: [+/-X]%
- Best day this week: [day] — [reason]

### Key Insight
[Single most important takeaway for strategy adjustment]
```
