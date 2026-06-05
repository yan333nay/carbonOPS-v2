# Task: whatsapp-orchestrator-handle-approval

**Agent:** Kai (whatsapp-orchestrator)
**Command:** `*handle-approval`
**Trigger:** Human approval or adjustment request received

---

## Purpose

Process the human's approval or adjustment after preview delivery. On approval, triggers auto-scheduling and updates goals tracker. On adjustment, routes to the correct mindclone and sends new preview.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `status` | Yes | `approved` or `adjust` |
| `adjustment_instruction` | If adjust | Free text instruction from human |
| `final_image` | Yes | Current image |
| `caption` | Yes | Current caption |
| `hashtags` | Yes | Current hashtag set |
| `posting_time` | Yes | Scheduled time |
| `platform` | Yes | Target platform(s) |
| `command` | Yes | Original /command |
| `client_id` | Yes | Client context |
| `iteration_count` | Yes | Number of adjustments so far (starts at 0) |

## On APPROVED

```
1. Call Rhythm (scheduler) → *schedule-post
   - Pass: image, caption, hashtags, posting_time, platform
   - Returns: confirmation + scheduled job ID

2. Update goals tracker
   - Decrement remaining count for this format type
   - Log post in post_log with status=scheduled

3. Send confirmation to WhatsApp:
   "✅ Agendado!
    {platform} — {format}
    Publicação: {posting_time}

    Meta da semana: {X} posts publicados de {Y} planejados."

4. Archive draft in session log
```

## On ADJUST

```
1. Check iteration_count — if >= 3:
   Send: "3 ajustes realizados. Recomendo recomeçar do zero para melhor resultado.
          'recomeça' para novo pipeline | 'sim' para aprovar versão atual"
   Stop and wait for response.

2. Parse adjustment_instruction to identify affected component:
   - Caption/copy → route to Gary mindclone
   - Visual/image → route to Cuenca → Pixel
   - Time/schedule → update Neil's recommendation only
   - Hashtags → update Neil's set only
   - Vague → Kiso evaluates and routes

3. Execute targeted adjustment (not full pipeline)

4. Reassemble package with unchanged components + new adjusted component

5. Increment iteration_count

6. Call *send-preview with updated package
```

## Auto-Schedule Integration

When calling Rhythm `*schedule-post`, pass:
```yaml
image: [file or URL]
caption: string
hashtags: [array]
platform: string
posting_time: 'HH:MM'
posting_date: 'YYYY-MM-DD'
format: feed|stories|reels|carousel|tiktok-video
client_id: string
job_id: 'auto-generated UUID'
```

## Goals Tracker Update

After successful scheduling, update `data/goals-tracker.yaml`:
```yaml
post_log entry:
  date: today
  time_published: posting_time (will be set when actually published)
  platform: platform
  format: format
  command_used: command
  status: scheduled
  neil_score: engagement_score
```

Decrement counters:
- If format=feed → feed_posts.remaining -= 1
- If format=stories → stories.remaining -= 1
- If format in [reels, tiktok-video] → reels_or_tiktoks.remaining -= 1

## Confirmation Message Templates

### Approved
```
✅ Agendado com sucesso!

📱 {platform} — {format}
🕐 Publicação: {posting_time} de {posting_date}

📊 Semana atual: {published}/{target} posts
Próximo alarme: {next_alarm_time}
```

### Adjustment complete (showing new preview)
```
🔄 Ajuste aplicado — iteração {iteration}/{max}

[new image attachment follows]
[new package details follow]
```
