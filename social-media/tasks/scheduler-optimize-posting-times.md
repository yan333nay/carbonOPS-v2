---
task: Optimize Posting Times
responsavel: '@scheduler'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - audience_analytics: Platform analytics data (audience active hours)
  - platform: Target platform
  - content_type: Type of content (reel/carousel/static/story)
  - historical_performance: Past post performance by time of day (optional)
Saida: |
  - optimal_times_per_platform: Best posting windows per platform
  - time_slots_ranked: List of time slots ranked 1-5 by expected performance
  - rationale: Data-based explanation for each recommendation
---

# optimize-posting-times

Analyze audience behavior and historical performance to define optimal posting windows.

## Time Optimization Factors

```
1. Audience active hours (from platform analytics)
2. Day of week performance patterns
3. Content type behavior (Reels discovery ≠ Stories consumption)
4. Timezone of primary audience
5. Competitor posting patterns (post when they're quiet)
```

## Output Format

```markdown
## Optimal Posting Times — [platform] — [brand]
**Data source:** [platform analytics / historical data / industry defaults]
**Primary audience timezone:** [timezone]

### Top 5 Time Slots
| Rank | Day | Time | Content Type | Expected Performance |
|------|-----|------|-------------|---------------------|
| 1 | [day] | [HH:MM] | [type] | Highest |
| 2 | [day] | [HH:MM] | [type] | High |
| 3 | [day] | [HH:MM] | [type] | Medium-High |
| 4 | [day] | [HH:MM] | [type] | Medium |
| 5 | [day] | [HH:MM] | [type] | Good backup |

### Rationale
[Data-based explanation per recommendation]

### Times to Avoid
- [Time window]: [reason]
```
