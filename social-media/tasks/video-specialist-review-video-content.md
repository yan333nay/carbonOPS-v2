---
task: Review Video Content
responsavel: '@video-specialist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - video_draft: Path or description of the video draft
  - brief: Original video brief used
  - platform_specs: Platform technical requirements
  - brand_guidelines: Brand visual/audio guidelines
Saida: |
  - review_verdict: APPROVED / NEEDS REVISION / REJECTED
  - revision_notes: Specific changes needed (if not approved)
  - approval_status: Final status with timestamp
Checklist:
  - '[ ] Check hook effectiveness (first 3 seconds)'
  - '[ ] Verify aspect ratio and safe zones'
  - '[ ] Confirm text overlays are readable and correctly positioned'
  - '[ ] Check audio quality and levels'
  - '[ ] Verify CTA is clear and visible'
  - '[ ] Confirm brand guidelines compliance'
  - '[ ] Check platform-specific requirements (caption, duration)'
---

# review-video-content

Quality gate for video content before publishing — ensures technical specs and creative quality meet standards.

## Review Criteria

| Category | What to Check | Pass Criteria |
|----------|--------------|---------------|
| Hook | First 3 seconds | Immediately grabs attention |
| Pacing | Cuts per minute | Matches platform standard |
| Text readability | Font size, contrast | Legible on mobile screen |
| Safe zones | UI overlap | No text in top 10% or bottom 20% |
| Audio | Music level, voice clarity | Music < 80% when voice present |
| CTA | Visibility, timing | Clear, appears in last 5s |
| Branding | Colors, logo, handle | Consistent with brand guide |
| Technical | Resolution, format | Meets platform specs |

## Output Format

```markdown
## Video Review — [topic]

**Verdict:** [APPROVED / NEEDS REVISION / REJECTED]
**Reviewed by:** Cleo (Video Specialist)
**Date:** [date]

### Checklist Results
- [✅/❌] Hook effectiveness: [note]
- [✅/❌] Technical specs: [note]
- [✅/❌] Text overlays: [note]
- [✅/❌] Audio: [note]
- [✅/❌] CTA: [note]
- [✅/❌] Brand compliance: [note]

### Revision Notes (if applicable)
1. [Specific change needed] — Scene: [timecode]
2. [Specific change needed] — Scene: [timecode]

### Next Step
[Publish / Return to editor with revision notes]
```
