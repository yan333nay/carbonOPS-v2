---
task: Schedule Post
responsavel: '@scheduler'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - post_content: Approved caption, hashtags, media reference
  - platform: Target platform
  - best_time_data: Optimal times from optimize-posting-times output
  - content_type: Type of post (reel/carousel/static/story)
Saida: |
  - scheduled_datetime: Confirmed publish datetime (ISO 8601)
  - scheduling_rationale: Why this time was chosen
  - confirmation: Scheduling confirmation entry
Checklist:
  - '[ ] Verify post_content is approved (not draft)'
  - '[ ] Select optimal datetime from best_time_data'
  - '[ ] Check for conflicts with other scheduled posts (min 3h between posts)'
  - '[ ] Confirm platform-specific format requirements'
  - '[ ] Add to scheduling log'
---

# schedule-post

Schedule an approved post at the optimal time for maximum reach and engagement.

## Scheduling Rules

```
Minimum interval between posts: 3 hours (same platform)
Maximum posts per day: 3 (feed) + unlimited stories
Never post at same time as a competitor if known
Avoid scheduling during known algorithm maintenance windows
```

## Platform Optimal Windows (Default)

| Platform | Best Days | Best Times |
|----------|-----------|-----------|
| Instagram | Tue, Wed, Thu | 9am, 12pm, 5pm local |
| TikTok | Mon, Wed, Fri | 7am, 12pm, 7pm local |
| LinkedIn | Tue, Wed, Thu | 8am, 12pm, 5pm |
| YouTube | Thu, Fri, Sat | 2pm, 4pm |

## Output Format

```markdown
## Post Scheduled

**Post:** [title/topic]
**Platform:** [platform]
**Format:** [format]
**Scheduled for:** [YYYY-MM-DD HH:MM TZ]
**Rationale:** [why this time — based on audience data or defaults]

### Scheduling Confirmation
- [ ] Added to content calendar
- [ ] Media assets confirmed attached
- [ ] Caption copy-pasted and verified
- [ ] Hashtags included
- [ ] CTA confirmed
```
