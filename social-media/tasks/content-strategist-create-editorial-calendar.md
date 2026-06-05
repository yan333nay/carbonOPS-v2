---
task: Create Editorial Calendar
responsavel: '@content-strategist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - content_pillars: Defined content pillars with ratios
  - posting_frequency: Posts per week per platform
  - platforms: Target platforms list
  - special_dates: Holidays, launches, campaigns, seasonal events
Saida: |
  - monthly_calendar: Full month content plan (MD table format)
  - weekly_breakdown: Week-by-week plan with topics per day
  - post_slots: Numbered post slots with pillar, format, and topic
Checklist:
  - '[ ] Calculate total post slots from posting_frequency × 4 weeks'
  - '[ ] Distribute slots according to pillar ratios'
  - '[ ] Assign content types to each slot (Reel, Carousel, Static, Story)'
  - '[ ] Map special_dates to relevant content angles'
  - '[ ] Ensure no more than 2 consecutive promotional posts'
  - '[ ] Generate weekly_breakdown table'
  - '[ ] Output monthly_calendar in markdown'
---

# create-editorial-calendar

Transform content pillars and posting frequency into a structured monthly editorial calendar.

## Calendar Construction Logic

```
Total monthly posts = posting_frequency × 4 weeks × number_of_platforms

Example (Instagram only, 5x/week):
= 5 × 4 = 20 posts/month

Pillar distribution (from ratios):
- Educational 40% = 8 posts
- Entertainment 30% = 6 posts
- Trust 20% = 4 posts
- Promotional 10% = 2 posts
```

## Format Distribution per Pillar

| Pillar | Recommended Formats |
|--------|-------------------|
| Educational | Carousel (save-worthy), Reel (quick tips) |
| Entertainment | Reel (trending audio), Static (memes) |
| Trust | Carousel (proof), Story (behind scenes) |
| Promotional | Static + Story + Reel (combo) |

## Output: Monthly Calendar

```markdown
## Editorial Calendar — [Month] [Year] — [Brand]

### Week 1
| Day | Platform | Format | Pillar | Topic | Status |
|-----|----------|--------|--------|-------|--------|
| Mon | Instagram | Reel | Educational | [Topic] | Draft |
| Tue | Instagram | Story | Trust | [Topic] | Draft |
| Wed | TikTok | Video | Entertainment | [Topic] | Draft |
| Thu | Instagram | Carousel | Educational | [Topic] | Draft |
| Fri | Instagram | Static | Promotional | [Topic] | Draft |

### Week 2
...

### Special Dates
- [Date]: [Event] → Content angle: [angle]
```
