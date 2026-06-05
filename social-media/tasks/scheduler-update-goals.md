# Task: scheduler-update-goals

**Agent:** Rhythm (scheduler)
**Command:** `*update-goals`
**Trigger:** Called by Kai after each post is approved and scheduled

---

## Purpose

Update the goals tracker after a post is scheduled. Decrements remaining targets, logs the post, and recalculates weekly progress.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `post_id` | Yes | Auto-generated UUID for this post |
| `client_id` | Yes | Client context |
| `platform` | Yes | instagram|tiktok |
| `format` | Yes | feed|stories|reels|carousel|tiktok-video |
| `command_used` | Yes | /command-name |
| `posting_time` | Yes | Scheduled datetime |
| `neil_score` | Yes | Predicted engagement score |
| `status` | Yes | scheduled|published|failed |

## Execution Steps

```
1. Load data/goals-tracker.yaml for client_id

2. Add post to post_log:
   {
     date: today (YYYY-MM-DD)
     time_published: posting_time
     platform: platform
     format: format
     command_used: command_used
     status: status
     neil_score: neil_score
     actual_score: null  # filled by Echo after 24h
   }

3. Decrement weekly remaining targets:
   - format == feed     → weekly.feed_posts.remaining -= 1
   - format == stories  → weekly.stories.remaining -= 1
   - format in [reels, tiktok-video] → weekly.reels_or_tiktoks.remaining -= 1

4. Update today's posted count:
   - today.feed_posts += 1 (if applicable)
   - today.stories += 1 (if applicable)
   - today.reels += 1 (if applicable)

5. Recalculate weekly completion percentage:
   - feed_rate = (target - remaining) / target * 100
   - stories_rate = (target - remaining) / target * 100
   - reels_rate = (target - remaining) / target * 100

6. Save updated goals-tracker.yaml

7. Return updated summary to Kai for confirmation message
```

## Weekly Reset (every Sunday at 23:59)

```
1. Archive current week's post_log as weekly_archive_{week_number}.yaml
2. Reset all remaining counts to weekly_targets_base values
3. Reset today's counters to 0
4. Increment week_number
5. Trigger Neil's weekly report (performance-analyst *generate-report)
```

## Output

Returns to Kai:
```yaml
updated: true
week_progress:
  feed: '{published}/{target}'
  stories: '{published}/{target}'
  reels: '{published}/{target}'
today_progress:
  feed_today: integer
  stories_today: integer
  reels_today: integer
next_alarm: 'HH:MM (next scheduled alarm)'
```
