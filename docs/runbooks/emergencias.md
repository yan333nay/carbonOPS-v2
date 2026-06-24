# Runbook de Emergências — Carbon Films
**Para uso de:** Yan e Joel
**Quando usar:** Situações fora do fluxo normal que exigem ação rápida

---

## ÍNDICE DE EMERGÊNCIAS

1. [NOVA deu uma resposta errada ou prejudicial a um lead](#nova-erro)
2. [Cliente ameaçou cancelar ou expressou insatisfação grave](#crise-cliente)
3. [Campanha de anúncios com problema crítico](#campanha-problema)
4. [Pagamento em atraso — cliente não responde](#inadimplencia)
5. [Agente de IA não está respondendo / travado](#agente-travado)
6. [Dado confidencial (preço, token, senha) foi exposto](#dado-exposto)
7. [Cliente pediu encerramento imediato de contrato](#encerramento-imediato)
8. [Lead importante recebido fora do horário de NOVA](#lead-urgente)

---

<a name="nova-erro"></a>
## 1. NOVA deu uma resposta errada ou prejudicial

**Sintomas:** NOVA prometeu resultado, citou preço sem proposta, foi agressiva,
deu informação errada, ou respondeu algo que envergonharia a agência.

**O que fazer imediatamente:**

```
PASSO 1 — Intervir na conversa
Assuma o WhatsApp/Instagram pessoalmente.
Envie: "Oi [Nome]! Aqui é [Yan]. Quero entrar em contato direto para garantir
que você tenha a melhor experiência. [Corrija/contextualize o que foi dito]."

PASSO 2 — Pausar NOVA (se o erro for grave)
Desative temporariamente a automação de NOVA no Make para aquele canal.
Não desative globalmente — só o gatilho do contato afetado.

PASSO 3 — Documentar o erro
Anote no ClickUp (task do lead): o que foi enviado, por que estava errado,
como você corrigiu.

PASSO 4 — Corrigir o prompt
Abra agents/nova.md no GitHub, adicione a regra que faltava na seção
"O QUE VOCÊ NUNCA FAZ", incremente a versão (v1.X), e faça commit.
Na próxima implantação, o prompt corrigido entra em produção.

PASSO 5 — Reativar NOVA
Reative o gatilho no Make somente após testar a correção.
```

**Não faça:** Não tente consertar mentindo ou inventando contexto. Honestidade
direta é sempre a saída mais barata.

---

<a name="crise-cliente"></a>
## 2. Cliente ameaçou cancelar / expressou insatisfação grave

**Sintomas:** Mensagem com tom de frustração ou crítica direta, pedido de
"conversa séria", silêncio prolongado após entrega, resposta monossilábica.

**O que fazer:**

```
PASSO 1 — Yan assume imediatamente (não delegue para NOVA)
Responda em até 2 horas úteis, pessoalmente:
"Oi [Nome]! Aqui é [Yan]. Recebi sua mensagem e quero conversar
pessoalmente. Pode falar agora ou tem um horário melhor?"

PASSO 2 — Antes da conversa, faça o diagnóstico interno
Perguntas para responder antes de ligar/reunir:
- O que foi entregue vs. o que foi prometido?
- A Carbon Films tem responsabilidade real nesta insatisfação?
- Qual é o histórico de comunicação recente (últimos 30 dias)?
- O cliente cumpriu os compromissos dele (aprovações, acessos, budget)?

PASSO 3 — Realize a reunião (Google Meet ou chamada — NUNCA só WhatsApp)
Roteiro:
1. "Quero ouvir tudo antes de falar qualquer coisa."
2. Ouça sem interromper. Tome notas.
3. Reconheça o que for legítimo: "Isso faz sentido, e eu entendo sua frustração."
4. Apresente o plano de correção com prazo específico.
5. Defina próximo passo concreto antes de encerrar.

PASSO 4 — Documente tudo no ClickUp
Task de crise: o que foi dito, o que foi acordado, prazo de resolução.

PASSO 5 — Acompanhe semanalmente até resolução
CEO-ATLAS faz check-in semanal com o status. Yan decide se escalona ou encerra.
```

**O que NUNCA fazer em crise:**
- ❌ Deixar passar mais de 24h sem resposta
- ❌ Resolver por texto/WhatsApp sem reunião quando o problema é sério
- ❌ Defender a agência antes de ouvir completamente
- ❌ Fazer promessas de resultado para "salvar" o contrato

---

<a name="campanha-problema"></a>
## 3. Campanha de anúncios com problema crítico

**Sintomas:** Verba sendo gasta sem conversão, campanha reprovada pela Meta/Google,
pixel sem disparar, conta de anúncios restrita, ROAS despencando.

**O que fazer:**

```
PASSO 1 — Pause as campanhas afetadas imediatamente
No Gerenciador de Anúncios da Meta ou Google Ads.
Registre horário de pausa no ClickUp.

PASSO 2 — Diagnóstico rápido (15 min)
- Qual campanha/conjunto está com problema?
- É aprovação, pixel, orçamento, ou performance?
- Quando começou? O que mudou nesse período?

PASSO 3 — Comunique o cliente antes que ele perceba
"Oi [Nome]! Identificamos [problema] nas campanhas e já estamos resolvendo.
Pausei preventivamente para não gastar verba enquanto ajustamos. Retorno
em até [X horas] com a solução."
Proatividade salva contratos. Silêncio os destrói.

PASSO 4 — Resolva e reative
Documente a causa raiz e a solução no ClickUp.
Reative somente após confirmar que o problema foi resolvido.

PASSO 5 — Relatório pós-incidente
Envie ao cliente: o que aconteceu, o que foi feito, como será prevenido.
1 página. Não precisa ser formal — pode ser WhatsApp com clareza.
```

**SLA de urgência:** Problema crítico em campanha = resposta em até 30 minutos, mesmo fora do horário.

---

<a name="inadimplencia"></a>
## 4. Pagamento em atraso — cliente não responde

**Protocolo por etapa (FINN monitora e alerta Yan):**

```
DIA 1 — Yan recebe alerta de FINN
Apenas monitore. Pode ser atraso bancário.

DIA 3 — NOVA envia mensagem gentil (automático via FINN→NOVA)
Template em templates/mensagens-padrao.md (MSG-Cobrança-D3)

DIA 7 — Yan decide a ação
Opções:
A) Ligar diretamente: "Oi [Nome], vi que o pagamento de [mês] não saiu ainda.
   Tudo bem por aí? Quer que eu mande um novo boleto?"
B) Continuar aguardando se houver contexto (viagem, doença, etc.)
C) Suspender entregas não urgentes enquanto resolve (comunicar ao cliente)

DIA 15 — Decisão formal Yan + Joel
- Notificação formal por e-mail com prazo de 5 dias para regularização
- Suspensão de serviços após o prazo
- Avaliação de encaminhamento jurídico se > R$[valor a definir]

NUNCA — Não corte serviços sem avisar com antecedência mínima de 48h.
```

---

<a name="agente-travado"></a>
## 5. Agente de IA não está respondendo / travado

**Sintomas:** Lead enviou mensagem há mais de 2h úteis sem resposta de NOVA,
automação não disparou, Make com erro.

```
PASSO 1 — Verificar o Make
Acesse o histórico de execuções no Make.
Há erro em algum cenário? Qual é a mensagem de erro?

Erros comuns e solução rápida:
- "Rate limit exceeded" → aguardar 5 min e reexecutar
- "Authentication failed" → reconectar a conta no Make (token expirou)
- "Webhook timeout" → verificar se o serviço externo (WhatsApp/ClickUp) está online
- Sem execução → verificar se o cenário está ativado (toggle ligado)

PASSO 2 — Assumir manualmente enquanto resolve
Se lead esperando: Yan responde manualmente enquanto a automação é restaurada.

PASSO 3 — Documentar e corrigir
Anote o erro, a causa e a solução no ClickUp (task "Manutenção de Sistema").
```

---

<a name="dado-exposto"></a>
## 6. Dado confidencial foi exposto (token, senha, preço)

```
PASSO 1 — Revogar imediatamente
Token de API: vá ao console do serviço e revogue o token em questão.
Senha: altere a senha do serviço afetado.
Gere novos e atualize no cofre de senhas (1Password/Bitwarden).

PASSO 2 — Atualizar no servidor
ssh no servidor / atualize variáveis de ambiente ou ~/.git-credentials.
Teste se o serviço continua funcionando com as novas credenciais.

PASSO 3 — Verificar se foi usado indevidamente
Para tokens de API: verifique o log de uso no console do serviço.
Se houver uso não autorizado: acione o suporte do serviço e registre ocorrência.

PASSO 4 — Auditar onde mais estava armazenado
Procure no repositório Git, no histórico de chat, em e-mails.
Limpe o que for possível.
```

---

<a name="encerramento-imediato"></a>
## 7. Cliente pediu encerramento imediato de contrato

```
PASSO 1 — Não reaja impulsivamente
Responda com calma: "Recebi sua mensagem. Posso falar com você hoje para
entender melhor e alinhar os próximos passos?"

PASSO 2 — Verificar o contrato antes da reunião
- Qual é a cláusula de aviso prévio? (geralmente 30 dias)
- Há valor a receber ainda?
- Há entregas em andamento?

PASSO 3 — Reunião de encerramento (Yan conduz)
- Ouvir o motivo sem defender
- Agradecer a parceria genuinamente
- Alinhar os últimos entregáveis e data final
- Definir processo de transferência de acessos e arquivos

PASSO 4 — Período de transição
- Finalizar entregas em andamento
- Preparar dossiê de saída (ver template em checklist Processo 08)
- Transferir acessos organizadamente

PASSO 5 — NPS e manutenção de relacionamento
7 dias após: PULSE envia MSG-NPS
3 meses após: PULSE envia MSG-Reativação
```

---

<a name="lead-urgente"></a>
## 8. Lead importante chegou fora do horário / NOVA não está ativa

```
PASSO 1 — NOVA responde dentro do SLA mesmo fora do horário
(NOVA é IA — não tem "fora do horário" para a primeira resposta)
Se NOVA estiver com problema: veja item 5.

PASSO 2 — Se for indicação de parceiro estratégico ou lead de alto valor
Yan responde pessoalmente: "Oi [Nome]! [Quem indicou] me falou de você.
Que bom ter você aqui! Me conta um pouco do que vocês precisam?"
```

---

## CONTATOS DE EMERGÊNCIA DO SISTEMA

| Serviço | Onde resolver | Urgência |
|---------|-------------|---------|
| Make (automação travada) | make.com → cenários → histórico | Alta |
| Anthropic API (IA fora) | console.anthropic.com → status | Alta |
| Meta Ads (campanha) | business.facebook.com | Crítica |
| Google Ads (campanha) | ads.google.com | Crítica |
| ClickUp (fora do ar) | status.clickup.com | Média |
| WhatsApp Business API | Painel do provedor (360dialog/Zenvia) | Alta |
