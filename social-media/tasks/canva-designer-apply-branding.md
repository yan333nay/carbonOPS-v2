# Task: canva-designer-apply-branding

**Agent:** Pixel (canva-designer)
**Command:** `*apply-branding`
**Trigger:** Used for `/edicao-basica` or when re-branding an existing design

---

## Purpose

Apply brandbook identity to a photo or existing design with minimal creative intervention. No complex design decisions — branding layer only.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `photo` | Yes | Source photo |
| `brandbook` | Yes | Active brandbook context |
| `format` | Yes | Target format (feed|stories|reels-thumbnail|tiktok) |
| `platform` | Yes | Target platform |
| `intensity` | No | `minimal`(default) or `full` |

## Branding Levels

### intensity: minimal (default for /edicao-basica)
- Logo applied at correct position and size
- Optional: thin brand-color border or subtle background element
- No text overlays
- No filters (unless photo needs exposure correction)
- Photo crops to format dimensions

### intensity: full
- All minimal treatments
- Brand color background elements
- Typography elements if space allows
- Pattern/texture overlay per brandbook

## Execution Steps

```
1. Load brandbook section 02 (visual identity)

2. Crop photo to target dimensions:
   - Maintain subject focus (face detection for portraits)
   - Apply rule-of-thirds or centered crop
   - Avoid cutting faces or key subjects

3. Create design canvas at correct dimensions

4. Place photo on canvas

5. Apply logo:
   - Version: per format (primary for dark bg, white for photo overlay)
   - Position: bottom-right default (brandbook section 04 override if specified)
   - Size: brandbook minimum size, never larger than 15% of frame width
   - Clear space: brandbook clear_space value

6. Apply intensity-specific treatments

7. Export per technical-specs.yaml

8. Quality check:
   - Logo not distorted
   - Subject not cut off
   - Brand colors accurate
   - No pixelation
```

## Output

Returns to Kai:
```yaml
final_image: [file_path or url]
dimensions: string
format: 'JPG'
branding_applied: [logo, border, background]
notes: string
```
