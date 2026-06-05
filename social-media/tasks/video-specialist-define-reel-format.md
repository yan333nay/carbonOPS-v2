---
task: Define Reel Format
responsavel: '@video-specialist'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - content_type: Type of content (educational/entertainment/product/testimonial/behind-scenes)
  - platform: Target platform
  - trending_formats: Current trending video formats (optional)
  - brand_style: Brand visual identity (minimalist/bold/raw/professional)
Saida: |
  - format_spec: Complete format specification
  - aspect_ratio: Recommended aspect ratio
  - pacing_guide: Cuts per minute, energy level
  - text_overlay_positions: Where to place text elements
---

# define-reel-format

Define the optimal video format spec for a content type on a specific platform.

## Format Library

| Format Name | Description | Best For |
|-------------|-------------|----------|
| Talking Head | Creator facing camera, speaking directly | Educational, personal brand |
| B-Roll + VO | B-roll footage with voice-over | Products, tutorials |
| Text-Only | Animated text on screen, no face | Anonymous brands, quotes |
| Screen Recording | App/software walkthrough | SaaS, tutorials |
| POV | First-person perspective | Lifestyle, behind-scenes |
| Storytime | Narrative with mixed clips | Trust building, viral stories |
| Transformation | Before/after structure | Results, products |
| Listicle | Numbered points in fast cuts | Educational, tips |
| Trending Template | Remix of viral format | Entertainment, discovery |

## Output Format

```markdown
## Reel Format Spec — [content_type] on [platform]

**Format:** [format name]
**Aspect Ratio:** 9:16
**Duration:** [X]s
**Pacing:** [X cuts/min] — [Energy level: High/Medium/Low]

### Structure
[0-X%]: Hook
[X-Y%]: Content
[Y-100%]: CTA

### Text Overlay Positions
Hook: [Center / Top third / Lower third]
Body text: [Lower third / Overlay / Subtitle style]
CTA: [Center / Bottom safe zone]

### Visual Style
[Description of visual direction]

### Examples to Reference
- [Creator or brand that does this format well]
```
