---
task: Create CTA
responsavel: '@copy-writer'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - post_objective: What the post is trying to achieve (awareness/engagement/traffic/conversion)
  - audience_stage: Where audience is in the funnel (cold/warm/hot)
  - platform: Target platform
  - desired_action: Specific action (comment/save/share/click/DM/follow)
Saida: |
  - cta_options: 3 CTA variations matching the objective
  - recommended_cta: Best option with rationale
  - placement_suggestion: Where in caption to place the CTA
Checklist:
  - '[ ] Match CTA to audience_stage (cold = soft ask, hot = direct ask)'
  - '[ ] Use action verb at the start of every CTA'
  - '[ ] Keep CTA to 1 action only — no double asks'
  - '[ ] Test urgency/scarcity if appropriate for objective'
  - '[ ] Output 3 variations with rationale'
---

# create-cta

Create compelling CTAs that turn passive viewers into active engagers and customers.

## CTA by Audience Stage

| Stage | Energy | CTA Examples |
|-------|--------|-------------|
| Cold (new audience) | Soft | "Salva esse post", "Segue pra mais conteúdo" |
| Warm (engaged) | Medium | "Me conta nos comentários", "Compartilha com quem precisa" |
| Hot (ready to buy) | Direct | "Clica no link da bio", "Me manda uma DM" |

## CTA by Desired Action

| Action | Power Phrases (PT-BR) |
|--------|----------------------|
| Comment | "Comenta aqui embaixo", "Me diz nos comentários", "Qual a sua opinião?" |
| Save | "Salva esse post antes que caia no esquecimento", "Guarda pra consultar depois" |
| Share | "Marca alguém que precisa ver isso", "Manda pra um amigo" |
| Follow | "Segue pra não perder o próximo post", "Ativa o sininho" |
| DM | "Me manda uma DM com [word]", "Fala comigo no direct" |
| Link | "Clica no link da bio", "O link tá nos stories" |

## Urgency Amplifiers (Use Sparingly)

- "Só até domingo"
- "Últimas vagas"
- "Enquanto está gratuito"
- "Antes de sair do ar"

## Output Format

```markdown
## CTAs for: [objective] — [audience_stage] — [platform]

**CTA 1 — [type]:**
"[cta text]"
Why: [rationale]

**CTA 2 — [type]:**
"[cta text]"
Why: [rationale]

**CTA 3 — [type]:**
"[cta text]"
Why: [rationale]

---
⭐ **Recommended:** CTA [N]
**Placement:** [end of caption / mid-caption / first comment]
```
