---
task: Suggest Content From Trends
version: 2.0.0
responsavel: '@trend-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - trend_report: Weekly trend report (from trend-analyst-scan-trends or trend-analyst-trend-report)
  - content_pillars: Brand content pillars
  - brand_voice: Brand personality and tone
  - platforms: Target platforms
Saida: |
  - content_ideas: List of content ideas with brief starter
  - brief_starters: Quick brief for each idea (topic, format, angle)
  - trending_angle: How each idea connects to the current trend
Checklist:
  - '[ ] Validate top 2-3 trends from trend_report are still active via WebSearch before building ideas'
  - '[ ] Filter trends through brand_voice and content_pillars'
  - '[ ] Generate minimum 5 content ideas'
  - '[ ] Include format recommendation per idea'
  - '[ ] Include trending angle connection with source reference'
  - '[ ] Flag any ideas that conflict with brand values'
---

# suggest-content-from-trends

Transform trend intelligence into branded content ideas the squad can immediately execute.

## WebSearch Validation Step (Required)

Trends in `trend_report` may be hours old. Before building content ideas, spot-check the top 2-3 trends:

```
Query: "{trend_name} instagram viral {current_date}"
       → Confirm the trend is still active and not fading

Query: "{trend_name} {niche} conteudo exemplo {month} {year}"
       → Find real content examples to inspire unique Carbon Films angle
```

If WebSearch shows a trend has peaked or faded since the report was generated, mark it as `FADING — skip` and deprioritize it.

## Trend Adaptation Framework

```
Trend (WebSearch-validated) + Brand Pillar + Unique Angle = Content Idea
```

Never chase trends that conflict with brand values. Filter every trend through:
1. Does this fit at least one of our content pillars?
2. Can we add a unique angle our audience hasn't seen?
3. Can we produce this in time for the trend window?
4. Is this trend still active right now? (WebSearch-confirmed)

## Output Format

```markdown
## Content Ideas from Trends — [week/date]

### Idea 1 — [title]
**Trend connection:** [which trend this rides]
**Content pillar:** [which pillar it fits]
**Format:** [Reel / Carousel / Static]
**Platform:** [platform]
**Angle:** [unique spin that makes it brand-fit]
**Hook starter:** "[suggested hook]"
**Urgency:** 🔴 Publish by [date]

### Idea 2 — [title]
...

### Idea 3 — [title] (Evergreen Angle)
**Trend connection:** [slow-burn trend]
...

---
## Ideas to Avoid This Week
- [Idea] — Reason: [doesn't fit brand / trend already fading / too controversial]
```
