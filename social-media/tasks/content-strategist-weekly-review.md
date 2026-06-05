---
task: Weekly Strategy Review
responsavel: '@content-strategist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - performance_report: Weekly performance report from performance-analyst
  - calendar_compliance: Percentage of scheduled posts that were published on time
  - audience_feedback: Comments, DMs, and engagement signals from the week
Saida: |
  - strategy_adjustments: Changes to content pillars, formats, or posting frequency
  - next_week_priorities: Top 3 content opportunities for next week
  - lessons_learned: What worked, what didn't, and why
Checklist:
  - '[ ] Review performance_report against KPI targets'
  - '[ ] Identify top-3 performing posts and extract patterns'
  - '[ ] Identify bottom-3 performing posts and diagnose issues'
  - '[ ] Review calendar_compliance — flag any missed posts'
  - '[ ] Analyze audience_feedback for content direction signals'
  - '[ ] Define strategy_adjustments (max 3 changes per week)'
  - '[ ] Set next_week_priorities based on data'
  - '[ ] Document lessons_learned'
---

# weekly-review

Analyze last week's performance to extract insights and refine strategy for the following week.

## Review Framework

```
DATA → PATTERNS → ADJUSTMENTS → NEXT WEEK PLAN
```

### What to Analyze

| Signal | What it means | Action |
|--------|--------------|--------|
| High saves | Content is reference-worthy | Create more depth content |
| High shares | Content resonates strongly | Double down on this pillar |
| High comments | Content sparks conversation | Add more opinion/question posts |
| High reach, low engagement | Good hook, weak content | Improve content body |
| Low reach, high engagement | Community loves it, algorithm doesn't | Improve hook/thumbnail |
| Best posting time | When audience is most active | Shift calendar to match |

## Output Format

```markdown
## Weekly Review — Week [N] — [Brand]
**Period:** [dates]

### Performance vs KPIs
| KPI | Target | Actual | Status |
|-----|--------|--------|--------|
| Reach | X | Y | ✅/⚠️/❌ |

### Top 3 Posts
1. [Post] — [metric] — Why it worked: [insight]

### Bottom 3 Posts
1. [Post] — [metric] — Why it underperformed: [diagnosis]

### Strategy Adjustments
1. [Adjustment] — Reason: [data signal]

### Next Week Priorities
1. [Priority] — Based on: [data]

### Lessons Learned
- [Lesson 1]
- [Lesson 2]
```
