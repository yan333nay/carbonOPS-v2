# Task: whatsapp-orchestrator-execute-pipeline

**Agent:** Kai (whatsapp-orchestrator)
**Command:** `*execute-pipeline`
**Trigger:** Called by *receive-command after validation

---

## Purpose

Orchestrate the full 4-mindclone pipeline execution for a given photo + command. Activates mindclones in the correct sequence defined by the command's `pipeline_order`.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | /command-name from commands-library |
| `photo` | Yes | Validated image |
| `client_id` | Yes | Client identifier |
| `brandbook_path` | Yes | Path to active brandbook context |
| `pipeline_config` | Yes | Command config from commands-library.yaml |
| `extra_context` | No | Additional context from user (consultive mode) |

## Pipeline Execution

### Default Sequence (unless command overrides)

```
STEP 1 — Rafael Kiso (Strategist)
  Input:  photo + command + brandbook + extra_context
  Output: strategy_brief
    - format confirmed
    - objective defined
    - hook concept
    - funnel stage mapped
    - content pillars aligned

STEP 2 — Paulo Cuenca (Creative Director)
  Input:  strategy_brief + photo + brandbook visual section
  Output: visual_briefing
    - template reference
    - photo positioning
    - text overlay specs
    - color palette selection
    - typography instructions
    - logo placement
    - mood direction

STEP 3 — Gary Vaynerchuk (Copywriter)
  Input:  strategy_brief + brandbook voice section
  Output: copy_package
    - hook (for image overlay if applicable)
    - caption (full, platform-formatted)
    - hashtag placeholder (Neil fills final set)
    - CTA

STEP 4 — Neil Patel (Performance)
  Input:  strategy_brief + copy_package + historical performance data
  Output: performance_package
    - final hashtag set (5-15 for Instagram, 3-6 for TikTok)
    - optimal posting time
    - engagement score (1-10 predicted)
    - platform-specific optimizations

STEP 5 — Pixel (canva-designer)
  Input:  visual_briefing + photo + brandbook context
  Output: final_image
    - exported at correct dimensions
    - branding applied
    - quality check passed
```

### Command-Specific Pipeline Overrides

Loaded from `data/commands-library.yaml` — each command defines its own `pipeline_order`:

| Command | Leader | Change from default |
|---------|--------|---------------------|
| `/feed-impactante` | Cuenca | Cuenca leads visual, Kiso validates |
| `/stories-simples` | Gary | Gary leads copy first |
| `/carrossel-edu` | Kiso | Kiso structures all slides |
| `/reels-trend` | Gary | Gary defines hook and angle |
| `/resultado-cliente` | Neil | Neil defines metric framing |
| `/bastidores` | Gary | Gary defines authentic angle |
| `/tiktok-viral` | Gary | Gary writes spoken hook first |
| `/autoridade` | Kiso + Neil | Dual leadership |
| `/edicao-basica` | Cuenca | Cuenca executes directly (skip other mindclones) |

## Execution Rules

- Each mindclone step must complete before the next begins (sequential, not parallel)
- If a step produces output below quality threshold, re-run that step once before continuing
- Total pipeline time target: < 90 seconds
- `/edicao-basica` shortcut: skip steps 1, 3, 4 — Cuenca → Pixel only

## Quality Checkpoints

After each mindclone step, verify:

**After Kiso:**
- [ ] Objective is concrete (not vague)
- [ ] Hook concept maps to a hook formula in viral-hooks-library.yaml
- [ ] Funnel stage identified

**After Cuenca:**
- [ ] Template reference is valid in commands-library.yaml
- [ ] All required visual briefing fields populated
- [ ] Photo positioning doesn't conflict with safe zones

**After Gary:**
- [ ] Caption has hook in first line
- [ ] Caption length matches command spec
- [ ] CTA is present and specific

**After Neil:**
- [ ] Hashtag count within platform limits
- [ ] Posting time is within best-posting-times.json windows
- [ ] Engagement score calculated

**After Pixel:**
- [ ] Image dimensions correct per technical-specs.yaml
- [ ] All visual quality checklist items passed

## Output

Passes to `*send-preview`:
```yaml
final_image: [file or URL]
caption: string
hashtags: [array]
posting_time: 'HH:MM platform timezone'
engagement_score: 1-10
command: /command-name
platform: [array]
pipeline_summary:
  kiso_objective: string
  gary_hook: string
  neil_score_reasoning: string
```
