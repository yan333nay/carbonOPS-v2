# Guia de Configuração do Fireflies.ai — Carbon Films
**Decisão:** 0.2 do Checklist
**Ferramenta:** Fireflies.ai (recomendado) — fireflies.ai

---

## POR QUE FIREFLIES

- Bot entra automaticamente nas reuniões do Google Meet via Google Agenda
- Transcrição em Português Brasileiro de boa qualidade
- Resumo automático com IA após cada reunião
- Webhook para integrar com Make → ClickUp
- ~$10-19/mês no plano Pro (suficiente para o volume da Carbon)

---

## PASSO 1 — CRIAR CONTA E PLANO

1. Acesse fireflies.ai → Sign up com a **conta Google da agência** (não pessoal)
2. Escolher plano: **Pro** (~$10/mês anual ou $19/mês mensal)
   - Plano gratuito tem limite de transcrições — insuficiente para operação
3. Inserir dados de pagamento (cartão internacional necessário)

---

## PASSO 2 — CONECTAR AO GOOGLE AGENDA

1. No painel do Fireflies → **Integrations** → Google Calendar
2. Autorizar acesso à conta Google da agência
3. Configurar: **"Auto-join all meetings"** → Ativar
   - Isso garante que o bot entre em TODA reunião automaticamente, sem precisar lembrar
4. Testar: criar evento de teste no Google Agenda com link Meet → verificar se o bot aparece na reunião

**Importante:** O bot aparece na reunião como "Fireflies.ai Notetaker". Avise os clientes
na primeira reunião que isso é uma ferramenta interna de transcrição.

Texto sugerido para avisar: *"Para garantir que nada se perca, usamos uma ferramenta de
transcrição automática nesta reunião. A transcrição fica apenas internamente conosco."*

---

## PASSO 3 — CONFIGURAR IDIOMA

1. Settings → **Language** → Portuguese (Brazil)
2. Salvar

---

## PASSO 4 — CONFIGURAR DESTINO DOS ARQUIVOS (Google Drive)

1. Integrations → Google Drive → Conectar
2. Configurar pasta de destino:
   - Pasta raiz: `Carbon Films > 01_Clientes`
   - **Problema:** Fireflies não organiza por cliente automaticamente — a integração
     com Make resolve isso (ver Passo 6)

---

## PASSO 5 — CONFIGURAR WEBHOOK PARA O MAKE

1. No Fireflies → Settings → **Webhooks**
2. Add Webhook:
   - URL: [URL do webhook do Make — gerado no Cenário 3 do Make]
   - Events: `Transcript Ready`
3. Salvar e testar

**O que acontece quando o webhook dispara:**
1. Fireflies envia JSON com: `{meeting_title, transcript_url, summary, participants, date}`
2. Make recebe → identifica o cliente pelo título da reunião → move a transcrição para
   a pasta correta do Drive → linka no ClickUp → aciona CEO-ATLAS

---

## PASSO 6 — NOMENCLATURA PADRÃO DE REUNIÕES

Para que o Make consiga identificar o cliente automaticamente pelo título da reunião,
padronize os títulos de eventos no Google Agenda:

**Formato obrigatório:** `Carbon Films x [Nome do Cliente] — [Tipo de Reunião]`

Exemplos:
- `Carbon Films x Clínica ABC — Reunião de Diagnóstico`
- `Carbon Films x Restaurante XYZ — Reunião de Relatório`
- `Carbon Films x Loja Fashion — Briefing Onboarding`

O Make usa o que está entre "x" e "—" para identificar o cliente no ClickUp.

---

## PASSO 7 — TESTAR O FLUXO COMPLETO

1. Criar evento no Google Agenda com o formato padrão + link Meet
2. Entrar na reunião → aguardar bot do Fireflies entrar
3. Falar por 2-3 minutos (testar transcrição)
4. Encerrar a reunião
5. Aguardar ~5 min e verificar:
   - [ ] Transcrição apareceu no painel do Fireflies
   - [ ] Webhook disparou no Make (ver histórico de execuções)
   - [ ] Arquivo apareceu no Google Drive na pasta correta
   - [ ] Link apareceu na task correspondente do ClickUp
   - [ ] Notificação chegou para Yan
6. Abrir a transcrição e avaliar a qualidade do Português

---

## SOLUÇÃO DE PROBLEMAS COMUNS

| Problema | Causa provável | Solução |
|---------|--------------|---------|
| Bot não entrou na reunião | Google Agenda não conectado ou auto-join desativado | Verificar configuração Passo 2 |
| Transcrição em inglês | Idioma não configurado | Passo 3 — configurar PT-BR |
| Webhook não disparou | URL incorreta ou Fireflies com erro | Testar webhook manualmente no painel |
| Arquivo não foi no Drive | Google Drive não conectado | Reconectar Google Drive nas integrações |
| Make não recebeu | Webhook URL incorreta ou Make offline | Verificar histórico de execuções no Make |
| Qualidade ruim de transcrição | Áudio da reunião com problema | Usar fones de ouvido, evitar ambiente barulhento |

---

## ALTERNATIVA: tl;dv

Se preferir testar antes de pagar, **tl;dv** oferece plano gratuito com limite generoso:
- tldv.io → Sign up com Google da agência
- Integração com Google Meet via extensão Chrome
- Qualidade de PT-BR similar ao Fireflies
- Webhook disponível no plano pago

---

## CUSTO ESTIMADO

| Plano | Preço | Reuniões/mês | Suficiente para |
|-------|-------|-------------|----------------|
| Free | $0 | 5 | Apenas teste |
| Pro | $10/mês (anual) | Ilimitado | ✅ Operação completa |
| Business | $19/mês | Ilimitado + recursos extras | Se crescer o time |

**Recomendação:** começar com Pro anual ($10/mês = $120/ano).
