---
task: Create Video Brief
responsavel: '@video-specialist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - topic: Video topic or main message
  - format: Video format (reel/tiktok/shorts/story)
  - platform: Target platform
  - duration: Target duration in seconds (15/30/60/90)
  - objective: Content objective (awareness/engagement/education/entertainment)
Saida: |
  - video_brief: Complete production brief
  - scene_breakdown: Scene-by-scene structure with timing
  - visual_references: Style references and visual direction
Checklist:
  - '[ ] Define hook scene (first 1-3 seconds)'
  - '[ ] Break video into scenes with timing'
  - '[ ] Specify text overlays per scene'
  - '[ ] Include visual style direction'
  - '[ ] Define CTA scene (last 3-5 seconds)'
  - '[ ] Specify aspect ratio and safe zone for UI elements'
---

# create-video-brief

Create a complete video production brief that any video editor or creator can execute without ambiguity.

## Video Format Specs

| Format | Aspect Ratio | Duration | Platform |
|--------|-------------|----------|----------|
| Reels | 9:16 | 15-90s | Instagram |
| TikTok | 9:16 | 15-60s | TikTok |
| Shorts | 9:16 | ≤60s | YouTube |
| Story | 9:16 | ≤15s | Instagram/TikTok |
| Feed video | 4:5 or 1:1 | 3-60s | Instagram |

## Video Structure by Duration

```
15s: Hook (3s) → Point (8s) → CTA (4s)
30s: Hook (3s) → Setup (5s) → Content (17s) → CTA (5s)
60s: Hook (3s) → Setup (7s) → 3 content blocks (10s each) → CTA (7s)
90s: Hook (5s) → Setup (10s) → 4 content blocks (15s each) → CTA (10s)
```

## Safe Zones for Reels/TikTok

```
Top 10%: Platform UI (avoid placing text here)
Bottom 20%: Caption + buttons (avoid placing text here)
Left 15%: TikTok user info (avoid key visuals here)
CENTER: Safe zone for all key content
```

## Output Format

```markdown
## Video Brief — [topic]
**Platform:** [platform] | **Format:** [format] | **Duration:** [Xs]
**Objective:** [objective]
**Aspect Ratio:** 9:16 | **Resolution:** 1080×1920

---
### Hook Scene (0:00–0:03)
Visual: [what appears on screen]
Text overlay: "[hook text]"
Energy: High/Medium/Low
Audio: [beat drop / voice-over / music starts]

### Scene 2 — [name] (0:03–0:10)
Visual: [description]
Text overlay: "[text]"
Transition: Cut / Zoom / Swipe

### Scene 3 — [name] (0:10–0:25)
...

### CTA Scene (final 5s)
Visual: [face to camera / product / text screen]
Text overlay: "[CTA text]"
Audio: [music fade / voice CTA]

---
### Visual Direction
Style: [cinematic / ugc / talking-head / b-roll / animated text]
Color palette: [warm/cool/neutral/brand colors]
Vibe: [examples: Alex Hormozi style / aesthetic / raw authentic]

### Notes for Editor
- [Any specific instruction]
```
