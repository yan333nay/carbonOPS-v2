---
task: Write Copy Variations
responsavel: '@copy-writer'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - base_copy: Original caption or copy to vary
  - variation_count: Number of variations (default: 3)
  - target_segments: Audience segments to address (optional)
Saida: |
  - copy_variations: List of distinct variations
  - differentiation_notes: What is different in each variation and why
  - recommended_test_order: Which to publish first, second, third
Checklist:
  - '[ ] Ensure each variation has a distinct hook'
  - '[ ] Vary psychological trigger per variation'
  - '[ ] Maintain brand voice consistency across all variations'
  - '[ ] Note key differences clearly per variation'
  - '[ ] Suggest A/B test order based on expected performance'
---

# write-variations

Generate distinct copy variations for A/B testing, ensuring each targets a different emotional angle.

## Variation Strategy

Each variation must differ in at least ONE of:
- Hook formula (curiosity vs provocation vs story)
- Emotional tone (empowering vs fear-based vs inspiring)
- Length (short punchy vs long detailed)
- CTA type (soft engagement vs direct action)

## Output Format

```markdown
## Copy Variations for: [topic]

### Variation A — [hook type]
[Full caption]
Key difference: [what makes this unique]

### Variation B — [hook type]
[Full caption]
Key difference: [what makes this unique]

### Variation C — [hook type]
[Full caption]
Key difference: [what makes this unique]

---
**Recommended Test Order:** A → B → C
**Why:** [performance hypothesis]
```
