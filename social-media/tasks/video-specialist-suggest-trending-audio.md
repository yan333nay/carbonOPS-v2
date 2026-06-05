---
task: Suggest Trending Audio
version: 2.0.0
responsavel: '@video-specialist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - platform: Target platform (instagram/tiktok)
  - content_mood: Video mood (energetic/emotional/educational/funny/inspiring)
  - target_audience: Audience profile
  - publication_date: When the video will be published
Saida: |
  - audio_suggestions: 3-5 audio tracks or types that fit
  - trend_score: How trending each audio is (hot/rising/stable/fading)
  - usage_tips: How to use each audio effectively
Checklist:
  - '[ ] Run WebSearch to find currently trending audios on the target platform'
  - '[ ] Verify audio trend lifecycle stage via WebSearch (emerging/hot/peaking/fading)'
  - '[ ] Identify audio trend window (hot trends fade in 3-7 days)'
  - '[ ] Suggest at least 3 audio options at different trend stages based on live data'
  - '[ ] Include one evergreen audio option as safe choice'
  - '[ ] Provide usage tips for each audio'
---

# suggest-trending-audio

Identify audio tracks that will maximize algorithm boost for Reels and TikTok.
**CRITICAL:** Trending audio changes within days. Always use WebSearch to verify current status before recommending — never rely solely on memory.

## WebSearch Step (Required)

Before generating suggestions, run:

```
Query 1: "musicas trending {platform} {month} {year} marketing brasil"
         → Current trending audios in the Brazilian marketing content space

Query 2: "trending sounds instagram reels {content_mood} {month} {year}"
         → Mood-specific audio trends for the target vibe

Query 3 (if publication_date is within 48h): "audio viral {platform} hoje semana"
         → Ultra-fresh signal for imminent publication
```

Use results to:
- Identify specific track names or sounds currently in the emerging/hot lifecycle phase
- Avoid recommending sounds that web results indicate are peaking or fading
- Find audio that matches the content mood AND has algorithmic momentum

## How Audio Affects Algorithm

```
TRENDING AUDIO = Algorithm boost (Instagram/TikTok push content with trending sounds)
ORIGINAL AUDIO = Lower initial boost but builds brand identity
EVERGREEN MUSIC = Consistent performance, no trend dependency
```

## Audio Trend Lifecycle

```
Emerging (days 1-3): Small creators use it → High risk, high reward
Hot (days 4-7): Viral spread → Best window to use
Peaking (days 8-14): Mainstream → Still good reach
Fading (days 15+): Overused → Diminishing returns
```

## Audio Strategy by Content Type

| Content Type | Audio Strategy |
|-------------|---------------|
| Educational | Lo-fi or calm trending music (voice must be clear) |
| Entertainment | Trending sound or viral audio clip |
| Inspiring | Emotional music rising trend |
| Behind-the-scenes | Casual trending song |
| Promotional | Original audio + trending mix |

## Output Format

```markdown
## Audio Suggestions — [content_mood] on [platform]

### Option 1 — [Track/Sound Name]
Status: 🔥 Hot (currently trending)
Usage: [how to use it — beat sync, lip sync, background, etc.]
Risk: High competition but algorithm boost

### Option 2 — [Track/Sound Name]
Status: 📈 Rising (3-5 days old)
Usage: [usage tip]
Risk: Lower competition, still boosted

### Option 3 — [Track/Sound Name] (Evergreen)
Status: 🟢 Stable
Usage: [usage tip]
Risk: Minimal — safe choice for educational content

### Option 4 — Original Audio
Status: Brand builder
Usage: Use your voice or create brand signature sound
Risk: No algorithm boost but builds brand identity

---
**Recommended:** Option [N] — [reason based on publication_date and content_mood]
```
