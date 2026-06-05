---
task: Create Hook
responsavel: '@copy-writer'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - topic: Post topic or main message
  - target_emotion: Desired emotional trigger (curiosity/fear/desire/surprise/anger/joy)
  - platform: Target platform
  - format: Content format (reel/carousel/static/story)
Saida: |
  - hook_variations: 5 hook options using different trigger types
  - psychological_trigger_used: Which trigger each hook uses and why
  - recommended_hook: Best hook for the context with rationale
Checklist:
  - '[ ] Generate hooks using minimum 3 different trigger types'
  - '[ ] Ensure each hook is ≤10 words for Reels/TikTok'
  - '[ ] Test each hook against "would I stop scrolling?" criteria'
  - '[ ] Identify psychological trigger used per hook'
  - '[ ] Select recommended_hook based on target_emotion + platform'
---

# create-hook

Create magnetic opening hooks that stop the scroll and compel the audience to consume the full content.

## The Hook Hierarchy (Most Powerful to Least)

```
1. CURIOSITY GAP — "The secret nobody tells you about X"
2. BOLD CLAIM — "This single habit tripled my income"
3. CHALLENGE/PROVOCATION — "You're doing X completely wrong"
4. NUMBERS — "7 things successful people never do"
5. STORY OPENER — "At 25, I lost everything. Here's what I learned."
6. QUESTION — "What would you do if you only had 30 days?"
7. RELATABILITY — "If you've ever felt like [pain point], this is for you"
```

## Hook Formulas by Platform

### Instagram Reels / TikTok (≤10 words, high visual energy)
- "Ninguém te conta isso sobre [topic]"
- "Eu testei [X] por 30 dias. Resultado?"
- "Para. Isso vai mudar como você [action]"
- "O erro que [90% das pessoas / todo mundo] comete"

### Instagram Carousel (text hook on cover slide)
- "X coisas que [expert] sabe que você não sabe"
- "O guia definitivo de [topic] em X slides"
- "Salva esse post — você vai precisar depois"

### LinkedIn
- "Unpopular opinion: [bold statement]"
- "After X years doing Y, I learned this:"
- "The [industry] nobody talks about:"

## Output Format

```markdown
## Hooks for: [topic]

**Hook 1 — Curiosity Gap**
"[hook text]"
Trigger: Creates information gap — viewer must watch to get the answer.

**Hook 2 — Bold Claim**
"[hook text]"
Trigger: Makes big promise — viewer wants to know how.

**Hook 3 — Provocation**
"[hook text]"
Trigger: Challenges belief — viewer wants to prove or disprove.

**Hook 4 — Numbers**
"[hook text]"
Trigger: Specific number = credibility + easy consumption promise.

**Hook 5 — Story**
"[hook text]"
Trigger: Emotional connection — viewer wants to know what happened.

---
⭐ **Recommended:** Hook [N]
**Reason:** [why this fits the target_emotion and platform best]
```
