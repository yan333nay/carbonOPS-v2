# Guia de Configuração do ClickUp — Carbon Films
**Para execução por Yan/Joel ou desenvolvedor**

---

## PASSO 1 — Criar o Workspace

1. Acesse app.clickup.com
2. Criar novo Workspace: **"Carbon Films"**
3. Fuso horário: **America/Sao_Paulo (GMT-3)**
4. Idioma: Português

---

## PASSO 2 — Criar Space COMERCIAL

1. New Space → Nome: **"COMERCIAL"**
2. Criar as seguintes listas:

### Lista: Leads em Qualificação

**Campos customizados obrigatórios:**
- `Canal de origem` (Dropdown): WhatsApp | Instagram | Facebook | Formulário | Indicação
- `Segmento` (Texto livre)
- `Budget estimado` (Dropdown): <R$1k | R$1-3k | R$3-7k | >R$7k
- `Fit cultural` (Dropdown): Baixo | Médio | Alto
- `Red flags` (Multi-select): Prazo irreal | Sem budget | Má experiência com agência | Tomador ausente | Outros
- `Score de qualificação` (Número 1-10)
- `Data do primeiro contato` (Data)
- `Próxima ação` (Texto)

**Status do workflow:**
Novo Lead → Em Qualificação → Aprovado p/ Reunião → Descartado

### Lista: Reuniões Agendadas

**Campos:**
- `Data da reunião` (Data)
- `Link do Meet` (URL)
- `Transcrição` (URL — preencher após reunião)
- `Ficha de diagnóstico` (URL — preencher após CEO-ATLAS processar)
- `Responsável Carbon` (Pessoa)
- `Status da reunião` (Dropdown): Agendada | Realizada | Cancelada | No-show

### Lista: Propostas em Produção

**Campos:**
- `Serviço(s)` (Multi-select)
- `Valor estimado` (Moeda)
- `Prazo de envio` (Data)
- `Responsável` (Pessoa)

### Lista: Propostas Enviadas

**Campos:**
- `Data de envio` (Data)
- `Valor` (Moeda)
- `Data de validade` (Data — automático: data envio + 15 dias)
- `Serviço(s)` (Multi-select)
- `Resultado` (Dropdown): Aguardando | Aprovada | Revisão solicitada | Recusada
- `Motivo se recusada` (Texto)

### Lista: Leads Descartados

**Campos:**
- `Motivo descarte` (Dropdown): Budget incompatível | Perfil inadequado | Desrespeitoso | Inativo | Outro
- `Observação` (Texto)
- `Pode reativar?` (Checkbox)

---

## PASSO 3 — Criar Space OPERAÇÕES

1. New Space → Nome: **"OPERAÇÕES"**
2. Para cada novo cliente, criar uma **Folder** (não lista) com o nome do cliente

### Template de Folder por Cliente (criar manualmente ou via automação)

Dentro de cada pasta de cliente, criar estas listas:

**Lista: Onboarding**
Usar checklist (ver arquivo `templates/checklist-onboarding.md`)
Status: A fazer | Em andamento | Bloqueado | Concluído

**Lista: Execução — Mês Atual**
Campos:
- `Tipo de tarefa` (Dropdown): Conteúdo | Tráfego | Relatório | Reunião | Aprovação | Outro
- `Prazo` (Data)
- `Responsável` (Pessoa — pode ser agente ou humano)
- `Awaiting approval` (Checkbox — marcar quando esperando resposta do cliente)
- `Link do entregável` (URL)

**Lista: Relatórios**
Campos:
- `Mês de referência` (Data)
- `Status` (Dropdown): Compilando dados | Em redação | Aguardando revisão | Enviado ao cliente | Apresentado
- `Link do relatório` (URL)

**Lista: Histórico**
Para tarefas concluídas de meses anteriores (arquivo).

---

## PASSO 4 — Criar Space FINANCEIRO

1. New Space → Nome: **"FINANCEIRO (FINN)"**

### Lista: Contratos Ativos

**Campos obrigatórios:**
- `Serviço(s) contratado(s)` (Multi-select)
- `Valor mensal` (Moeda)
- `Data de início` (Data)
- `Data de vencimento` (Data)
- `Status de pagamento` (Dropdown): Em dia | Atrasado 1-3d | Atrasado 4-7d | Inadimplente | Encerrado
- `Fase da esteira` (Dropdown): Entrada | Core | Premium
- `LTV acumulado` (Moeda — atualizar mensalmente)
- `Responsável operacional` (Pessoa)

### Lista: Inadimplências

**Campos:**
- `Valor em atraso` (Moeda)
- `Dias em atraso` (Número)
- `Última mensagem enviada` (Data)
- `Decisão de Yan` (Dropdown): Aguardando | Negociar | Suspender | Acionar jurídico

### Lista: Renovações — Próximos 30 dias

**Campos:**
- `Data de vencimento` (Data)
- `Valor atual` (Moeda)
- `Recomendação de FINN` (Dropdown): Renovar igual | Propor expansão | Reavaliar
- `Status` (Dropdown): A contatar | Proposta enviada | Renovado | Encerrado

---

## PASSO 5 — Configurar Automações Básicas no ClickUp

### Automação 1: Lead avança → Notificar Yan
- Trigger: Status muda para "Aprovado p/ Reunião"
- Ação: Notificação para Yan (e-mail/WhatsApp via webhook Make)

### Automação 2: Proposta sem atualização em 48h
- Trigger: Task em "Propostas Enviadas" sem mudança de status por 2 dias
- Ação: Notificação interna para CEO-ATLAS / acionar PULSE-03

### Automação 3: Contrato encerrado → Mover para histórico
- Trigger: Status de pagamento = "Encerrado"
- Ação: Mover task para lista de histórico + notificar FINN e PULSE

---

## PASSO 6 — Gerar API Key

1. Configurações → Apps → API
2. Gerar API Key pessoal (ou token de workspace)
3. **IMPORTANTE:** Salvar em cofre seguro (1Password, Bitwarden)
4. NUNCA salvar em arquivo de texto, e-mail ou mensagem

---

## PASSO 7 — Testar

Criar task de teste em cada Space:
- Criar → Preencher campos → Mover entre status → Deletar
- Verificar se automações dispararam corretamente

**Critério de conclusão:** Todos os Spaces funcionando, campos preenchíveis,
automações disparando sem erro em 3 testes consecutivos.
