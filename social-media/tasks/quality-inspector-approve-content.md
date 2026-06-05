# quality-inspector-approve-content

## Task Identity

- **Agent:** quality-inspector (Vera)
- **Command:** `*approve-content`
- **Version:** 1.0.0
- **Category:** quality-control

## Purpose

Registra formalmente a aprovação de um pacote de conteúdo e autoriza a passagem para a etapa de postagem. Deve ser chamada após veredicto APPROVED no final-gate.

## Input

```yaml
required:
  - verdict_report: object  # output completo do final-gate
  - production_package: object  # arquivo + copy + caption + hashtags
  - content_idea: object  # briefing original
optional:
  - authorized_posting_time: string  # default: horário otimizado do brandbook
```

## Execution Steps

1. **Validar veredicto** — confirmar que final-gate retornou APPROVED
2. **Registrar aprovação** em `data/quality-approvals.json`:
   ```json
   {
     "approved_at": "ISO timestamp",
     "topic": "string",
     "format": "string",
     "content_pillar": "string",
     "score": float,
     "scores_detail": { "impacto": N, "marca": N, "copy": N, "visual": N, "estrategia": N },
     "iteration": integer,
     "authorized_time": "string",
     "production_file": "string",
     "caption_preview": "primeiros 100 chars"
   }
   ```
3. **Definir horário de postagem** — usar `authorized_posting_time` ou carregar de `data/best-posting-times.json`
4. **Emitir autorização** para o stage `post` do workflow
5. **Logar** aprovação

## Output

```yaml
status: approved
authorized_time: string
posting_package:
  file: 'path para arquivo de produção'
  caption: 'legenda final'
  hashtags: [lista]
  cta: 'call-to-action'
  format: string
  platform: instagram
approval_record_saved: boolean
message: '✅ Conteúdo aprovado por Vera. Autorizado para postagem às [horário].'
```

## Next Stage

Após este output: `post` (scheduler executa a postagem)
