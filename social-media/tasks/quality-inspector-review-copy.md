# quality-inspector-review-copy

## Task Identity

- **Agent:** quality-inspector (Vera)
- **Command:** `*review-copy`
- **Version:** 1.0.0
- **Category:** quality-control

## Purpose

Avaliação focada exclusivamente na copy: hook, corpo, caption, hashtags e CTA. Usada quando apenas o texto precisa de revisão (visual já aprovado) ou como etapa isolada de diagnóstico.

## Input

```yaml
required:
  - hook: 'texto do hook principal'
  - caption: 'legenda completa'
  - cta: 'call-to-action'
optional:
  - body_slides: [array de textos por slide]
  - hashtags: [lista]
  - format: 'carousel | reel | static | stories'
  - target_pillar: 'pilar editorial alvo'
```

## Evaluation Criteria

### Hook Analysis
1. **Especificidade:** Tem número, dado ou afirmação verificável?
2. **Relevância:** É sobre o nicho de videomaking/marketing de resultados?
3. **Tensão:** Cria curiosidade ou urgência suficiente para o scroll parar?
4. **Originalidade:** Diferente de hooks usados nas últimas 4 semanas?
5. **Promessa:** O que o hook promete, o conteúdo entrega?

Hook score guide:
- 5: "3 erros que fazem sua agência parecer amadora em 2026" → específico + número + ano + dor
- 3: "Como melhorar seu conteúdo de vídeo" → relevante mas genérico
- 1: "Dicas de marketing para você" → completamente genérico

### Caption Structure Check
```
Estrutura ideal:
[HOOK] — espelha ou aprofunda a capa (1-2 linhas)
[LINHA EM BRANCO]
[PREVIEW] — o que o leitor vai encontrar (2-3 linhas)
[LINHA EM BRANCO]
[CTA] — ação específica (salva, comenta com X, manda DM "Y")
[LINHA EM BRANCO]
[HASHTAGS]

Verificações:
- [ ] Hook na primeira linha (algoritmo)
- [ ] Quebras de linha para respiração visual
- [ ] CTA com ação específica (não "siga nosso perfil")
- [ ] Mínimo 150 caracteres no corpo
- [ ] Máximo 2200 caracteres total
- [ ] 8-15 hashtags relevantes (não repetidas do último post)
```

### CTA Quality
Fraco: "Siga nosso perfil" | "Curta e compartilhe"
Médio: "Salva esse post" | "Manda pra quem precisa ver"
Forte: "Comenta VÍDEO que a gente te manda o guia grátis" | "Manda DM com ORÇAMENTO que a gente responde hoje"

### Grammar & Style
- Concordância nominal e verbal correta
- Sem uso de caixa-alta excessiva (só para ênfase estratégica)
- Sem excessivo uso de emojis (máximo 3-5 por caption)
- Voz consistente com brandbook: direta, premium, sem enchimento

## Output

```yaml
copy_score: integer  # 1-5
issues:
  - dimension: 'hook | caption | cta | hashtags | grammar'
    severity: 'critical | important | minor'
    description: string
    fix: string
verdict: 'APPROVED | NEEDS_REVISION'
revised_hook: string  # sugestão de hook melhorado (se score < 4)
revised_cta: string   # sugestão de CTA melhorado (se score < 4)
notes: string
```
