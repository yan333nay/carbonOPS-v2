# Task: canva-designer-generate-design

**Agent:** Pixel (canva-designer)
**Command:** `*generate-design`
**Trigger:** Called by Kai (whatsapp-orchestrator) after Cuenca delivers visual briefing

---

## Purpose

Generate a publish-ready design using the Canva Connect API. Takes Cuenca's visual briefing and the human's photo, fills the correct template, applies brandbook rules, and exports at the correct dimensions.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `visual_briefing` | Yes | Full briefing from Paulo Cuenca mindclone |
| `photo` | Yes | Human's original photo |
| `command` | Yes | /command-name |
| `brandbook` | Yes | Active brandbook context |
| `client_id` | Yes | Client identifier |

## Visual Briefing Schema (expected from Cuenca)

```yaml
command: /command-name
platform: instagram|tiktok
dimensions: '1080x1350'
template_ref: 'template-id-in-canva-account'
photo_position: 'center-top|full-bleed|left|right|background'
photo_crop: 'face-crop|rule-of-thirds|centered'
text_overlay:
  enabled: boolean
  hook_text: 'string (if applicable)'
  hook_position: 'top|bottom-third|center'
  hook_style: 'bold-white|dark-outlined|brand-color'
  subtitle_text: 'string (optional)'
  subtitle_position: 'below-hook|bottom'
color_palette: 'primary|secondary|monochrome'
logo:
  visible: boolean
  position: 'bottom-right|top-right|bottom-center'
  size: 'small|medium'
  version: 'primary|white|black|icon'
filters: []  # empty = no filter
mood: 'strong|clean|minimal|raw|educational|authority'
```

## Canva API Execution Steps

```
1. Authenticate with Canva Connect API (OAuth2)

2. Select template:
   - Map command to template_ref from data/commands-library.yaml
   - Verify template exists in client's Canva account
   - Fetch template structure (layers, elements)

3. Replace photo:
   - Upload human's photo to Canva
   - Replace photo layer in template
   - Apply positioning: photo_position + photo_crop

4. Apply text overlays (if enabled):
   - Replace text elements with hook_text and subtitle_text
   - Apply font from brandbook section 02 (typography)
   - Apply color from visual_briefing.color_palette
   - Verify text within safe zones (technical-specs.yaml)

5. Apply branding:
   - Set background color per brandbook primary/secondary
   - Position logo per visual_briefing.logo config
   - Enforce brandbook colors on all non-photo elements

6. Apply filters (if specified):
   - Apply only filters in brandbook.photography.approved_filters
   - Default: no filter (brandbook standard)

7. Export:
   - Format: JPG for static, PNG if transparency needed
   - Dimensions: per technical-specs.yaml for command + platform
   - Quality: maximum available
   - File size optimization: target < 5MB

8. Run quality checklist (see below)

9. Return final_image to Kai
```

## Quality Checklist (MUST PASS before delivery)

- [ ] Dimensions exactly match technical-specs.yaml for this format
- [ ] All text within safe zones
- [ ] Hook text legible at thumbnail size (test: resize to 200x200)
- [ ] Brand colors match brandbook hex values (max 5% deviation)
- [ ] Font is approved typeface (not template default)
- [ ] Logo present if required, correctly positioned and sized
- [ ] Photo has no pixelation at export dimensions
- [ ] No lorem ipsum or placeholder text remaining
- [ ] No watermarks visible
- [ ] File size within limits

## Error Handling

| Error | Response |
|-------|----------|
| Template not found | Alert Kai: "Template {ref} not found in Canva. Using base template for {command}." |
| Photo upload fails | Alert Kai: "Photo upload failed. Check file format and size." |
| Font not in Canva account | Use closest approved alternative, flag in output |
| Export dimensions mismatch | Re-export with explicit dimension override |
| Quality check fails | Attempt auto-correction once, then flag to Kai |

## Output

Returns to Kai:
```yaml
final_image: [file_path or canva_export_url]
dimensions: '1080x1350'
format: 'JPG'
file_size: 'XMB'
canva_design_id: 'design-uuid'
quality_check: passed
notes: 'Any flags or deviations from briefing'
```
