---
task: Generate Content Calendar
responsavel: '@scheduler'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - editorial_calendar: Monthly editorial plan from content-strategist
  - post_slots: Individual post assignments per day
  - content_package: Approved content from squad (copy, hooks, hashtags)
  - special_dates: Holidays and campaign dates
Saida: |
  - content_calendar_md: Visual content calendar in markdown
  - weekly_grid: Grid view with all posts and statuses
  - daily_actions: Actionable daily task list
---

# generate-content-calendar

Transform the editorial plan and content package into an operational content calendar.

## Output Format

```markdown
# Content Calendar — [Month] [Year] — [Brand]
Generated: [date] by Rhythm (Scheduler)

---
## Monthly Overview

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|------|-----|-----|-----|-----|-----|-----|-----|
| W1 | [post] | [post] | — | [post] | [post] | — | — |
| W2 | [post] | — | [post] | [post] | — | [post] | — |
| W3 | ... |
| W4 | ... |

Legend: R=Reel | C=Carousel | S=Static | ST=Story | — =No post

---
## Weekly Detail

### Week 1 — [dates]

**Monday**
- 09:00 | Instagram | Reel | [topic]
  Caption: [first line of approved caption]
  Status: ✅ Ready to publish

**Tuesday**
- 12:00 | Instagram | Carousel | [topic]
  Caption: [first line]
  Status: ⏳ Copy ready, visual pending

**Wednesday** — No post scheduled

**Thursday**
- 18:00 | TikTok | Video | [topic]
  Status: ⚠️ Video in production

[... continue for all days]

---
### Week 2 — [dates]
...

---
## Special Dates This Month
| Date | Event | Content Plan | Status |
|------|-------|-------------|--------|
| [date] | [event] | [plan] | ⏳ |

---
## Content Status Legend
✅ Ready | ⏳ In production | ⚠️ Needs attention | ❌ Missing
```
