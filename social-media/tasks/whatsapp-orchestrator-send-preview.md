# Task: whatsapp-orchestrator-send-preview

**Agent:** Kai (whatsapp-orchestrator)
**Command:** `*send-preview`
**Trigger:** Called by *execute-pipeline after all steps complete

---

## Purpose

Assemble the complete content package and send it to the human via WhatsApp for a single approval decision.

## Inputs

| Field | Required | Description |
|-------|----------|-------------|
| `final_image` | Yes | Exported image from Pixel (canva-designer) |
| `caption` | Yes | Full caption from Gary mindclone |
| `hashtags` | Yes | Final hashtag set from Neil |
| `posting_time` | Yes | Suggested time from Neil |
| `engagement_score` | Yes | Predicted score 1-10 |
| `command` | Yes | /command that generated this content |
| `platform` | Yes | Target platform(s) |
| `pipeline_summary` | No | Brief note on strategy decisions |

## Preview Package Format

Send to WhatsApp in this order:

### Message 1 — Image
```
[final_image attachment]
```

### Message 2 — Content Details
```
✅ Pacote completo — {command}

📝 LEGENDA:
{caption}

🏷️ HASHTAGS:
{hashtags_formatted}

🕐 Horário sugerido: {posting_time} ({platform})
📊 Score de engajamento previsto: {score}/10

——

Aprovado? Responda:
• "sim" ou "✓" → agendamento automático
• "ajusta [instrução]" → squad executa a mudança
• "recomeça" → novo pipeline do zero
```

## Approval Response Detection

Monitor for user response after preview is sent:

| Response pattern | Action |
|-----------------|--------|
| `sim`, `ok`, `aprovado`, `✓`, `👍` | Call `*handle-approval` with status=approved |
| starts with `ajusta` or `muda` or `troca` | Call `*handle-approval` with status=adjust + instruction |
| `recomeça` or `começa de novo` | Call `*receive-command` fresh with original photo |
| No response in 2h | Send reminder: "Post está aguardando aprovação. 'sim' para agendar." |
| No response in 24h | Archive draft, send notification |

## Adjustment Handling

When adjustment is requested, route to correct mindclone:

| Adjustment type | Route to |
|----------------|---------|
| "muda a legenda" / "ajusta o texto" | Gary → reassemble |
| "muda a imagem" / "ajusta visual" | Cuenca → Pixel → reassemble |
| "muda o horário" | Neil only → quick update |
| "muda as hashtags" | Neil only → quick update |
| "muda tudo" | Full pipeline restart |
| generic adjustment | Kiso evaluates → routes to correct mindclone |

Max iterations: 3 adjustments before flagging "Recomendo recomeçar do zero para melhor resultado."

## Output (on approval)

Calls `*handle-approval` with:
```yaml
status: approved
final_image: [file or URL]
caption: string
hashtags: [array]
posting_time: string
platform: [array]
command: string
client_id: string
```
