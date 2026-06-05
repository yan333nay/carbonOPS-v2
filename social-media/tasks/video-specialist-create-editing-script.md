---
task: Create Editing Script
responsavel: '@video-specialist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - video_brief: Video brief from create-video-brief task
  - hook: Hook text from copy-writer
  - cta: CTA from copy-writer
  - duration: Total video duration in seconds
Saida: |
  - editing_script: Frame-by-frame editing instructions
  - cut_list: List of cuts with timecodes
  - transition_notes: Transition types between scenes
  - audio_cues: When music starts, beats, fade in/out
Checklist:
  - '[ ] Open with strongest hook in first 1-3 frames'
  - '[ ] Define cut points every 2-4 seconds (fast pacing for Reels)'
  - '[ ] Add text overlay timecodes'
  - '[ ] Specify transition type per cut'
  - '[ ] Add audio cue markers'
  - '[ ] End with clear CTA frame'
---

# create-editing-script

Write a technical editing script that eliminates guesswork for the video editor.

## Pacing Guide by Platform

| Platform | Average cut interval | Pacing style |
|----------|---------------------|-------------|
| TikTok | 1.5-2s | Hyper fast |
| Instagram Reels | 2-3s | Fast |
| YouTube Shorts | 3-4s | Medium-fast |
| Instagram Stories | 5-10s | Medium |

## Output Format

```markdown
## Editing Script — [topic] — [duration]s

### TRACK LAYOUT
Audio: [track name] — BPM: [X] — Start: 0:00

---
### FRAME-BY-FRAME

**[0:00–0:02] HOOK**
Clip: [description of clip to use]
Text overlay: "[hook text]" — Font: Bold/Large — Position: Center
Transition IN: Cut / Fade from black
Audio: Music starts at 100% volume

**[0:02–0:05] SETUP**
Clip: [description]
Text overlay: "[text]" — Position: Lower third
Transition: Jump cut
Audio: Continue

**[0:05–0:12] CONTENT BLOCK 1**
Clip: [description]
Text overlay: "[text]"
Beat sync: Cut on beat at [0:07]
Transition: Zoom cut

**[0:12–0:20] CONTENT BLOCK 2**
...

**[0:XX–END] CTA**
Clip: [face to camera / product / text screen]
Text overlay: "[CTA text]" — Bold, center
Audio: Music fade to 30% volume
End card: [logo / handle / link]

---
### EXPORT SPECS
Resolution: 1080×1920 (9:16)
FPS: 30 (or 60 for smooth)
Format: MP4 H.264
Audio: AAC 44.1kHz
```
