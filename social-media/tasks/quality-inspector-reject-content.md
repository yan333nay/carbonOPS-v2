# quality-inspector-reject-content

## Task Identity

- **Agent:** quality-inspector (Vera)
- **Command:** `*reject-content`
- **Version:** 1.0.0
- **Category:** quality-control

## Purpose

Registra formalmente a rejeição de um pacote de conteúdo e devolve para o agente responsável com feedback estruturado e acionável. Se a iteração atingir o limite máximo (3), escalona para revisão humana.

## Input

```yaml
required:
  - verdict_report: object  # output completo do final-gate com scores e problemas
  - production_package: object  # pacote que foi rejeitado
  - iteration: integer  # número da tentativa atual
optional:
  - previous_feedbacks: [array]  # feedbacks das iterações anteriores
```

## Execution Steps

1. **Validar veredicto** — confirmar que final-gate retornou REJECTED
2. **Checar limite de iterações:**
   ```
   if iteration >= 3:
     → escalar_para_humano = true
     → preparar relatório completo
   else:
     → escalar_para_humano = false
   ```
3. **Registrar rejeição** em `data/quality-rejections.json`:
   ```json
   {
     "rejected_at": "ISO timestamp",
     "topic": "string",
     "format": "string",
     "score": float,
     "main_issues": [array],
     "iteration": integer,
     "escalated_to_human": boolean
   }
   ```
4. **Formatar feedback** — priorizado por impacto, específico e acionável
5. **Identificar agente receptor:**
   - Problema de COPY → `copy-writer` (Lyra)
   - Problema de VISUAL/MARCA → `canva-designer` (Pixel)
   - Problema de ESTRATÉGIA → `content-strategist` (Nova)
   - Problema de IMPACTO (hook geral) → `copy-writer` + consultar mind-council

## Feedback Format

```
❌ REJEITADO — Iteração [N]/3

Score: [X.X]/5

Problemas para corrigir (em ordem de prioridade):

[CRÍTICO] [DIMENSÃO]: [descrição específica do problema]
→ Solução: [instrução exata do que fazer]
→ Exemplo: [se possível, exemplo do que ficaria correto]

[IMPORTANTE] [DIMENSÃO]: [descrição]
→ Solução: [instrução]

Retornar para: @[agente] com as correções acima.
Prazo: corrigir e reenviar para Vera antes de qualquer postagem.
```

## Escalation to Human (iteration >= 3)

```
🚨 ESCALONANDO PARA REVISÃO HUMANA

3 iterações atingidas sem aprovação.

Relatório completo:
- Tentativas: 3
- Scores: [iter1: X.X] [iter2: X.X] [iter3: X.X]
- Problema persistente: [descrição do problema que não foi resolvido]
- Feedback dado em cada iteração: [resumo]

Ação necessária: Revisão manual do conteúdo pelo usuário.
Options:
  1. Aprovar manualmente (override Vera)
  2. Dar nova direção criativa para o squad
  3. Descartar e gerar novo conteúdo sobre outro tema
```

## Output

```yaml
status: rejected
iteration: integer
escalate_to_human: boolean
return_to_agent: string  # 'copy-writer' | 'canva-designer' | 'content-strategist'
feedback:
  priority_issues: [array]
  instruction: string  # instrução principal para correção
rejection_record_saved: boolean
message: string  # mensagem formatada de rejeição
```
