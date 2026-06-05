/**
 * Sequência de prospecção: D0 (contato inicial) + D1 (1 follow-up único).
 * Conduta: máximo 2 mensagens sem resposta. Após step 2 sem resposta → closed_sem_resposta.
 *
 * Cada nicho tem 3 variantes de serviço:
 *   0 — Site / Landing Page de conversão
 *   1 — Bot IA / Automação via WhatsApp
 *   2 — Tráfego Pago com IA
 *
 * A variante é escolhida deterministicamente pelo WhatsApp do lead (últimos 4 dígitos % 3),
 * garantindo variedade entre leads sem precisar armazenar estado extra.
 *
 * A/B Styles (por variante de serviço):
 *   A — question-first: faz pergunta direta sobre o processo atual
 *   B — data-first: apresenta dado/resultado antes de perguntar
 *   C — curiosity hook: abre com gancho de curiosidade
 */

// Derivar índice de variante (0, 1 ou 2) a partir do número do WhatsApp
function variantIdx(whatsapp) {
  const digits = (whatsapp || '').replace(/\D/g, '');
  const last4 = parseInt(digits.slice(-4) || '0', 10);
  return last4 % 3;
}

// ─── A/B Style Selector ──────────────────────────────────────────────────────

const AB_STYLES = ['A', 'B', 'C'];

/**
 * Seleciona o estilo A/B/C para um lead baseado em performance histórica.
 * - Se algum estilo tem < 5 leads enviados → distribuição uniforme (exploração)
 * - Se todos >= 5 → weighted random: melhor taxa tem 60%, os outros 20% cada
 * Salva o estilo em contact.abStyle no db (se db for passado).
 */
function selectABStyle(nicho, serviceVariantIdx, db, contact) {
  if (!db || !db.contacts) {
    // Sem db: uniforme aleatório
    const style = AB_STYLES[Math.floor(Math.random() * 3)];
    if (contact) contact.abStyle = style;
    return style;
  }

  // Conta envios e respostas por estilo para este nicho + variante de serviço
  const stats = { A: { sent: 0, responded: 0 }, B: { sent: 0, responded: 0 }, C: { sent: 0, responded: 0 } };
  for (const c of db.contacts) {
    if (c.nicho !== nicho) continue;
    if (variantIdx(c.whatsapp) !== serviceVariantIdx) continue;
    const s = c.abStyle;
    if (!s || !stats[s]) continue;
    stats[s].sent++;
    if (c.responded) stats[s].responded++;
  }

  // Exploração: se algum estilo tem < 5 leads enviados → uniforme
  const needsExploration = AB_STYLES.some(s => stats[s].sent < 5);
  let chosen;
  if (needsExploration) {
    chosen = AB_STYLES[Math.floor(Math.random() * 3)];
  } else {
    // Weighted random pelo response rate
    const rates = AB_STYLES.map(s => stats[s].sent > 0 ? stats[s].responded / stats[s].sent : 0);
    const bestIdx = rates.indexOf(Math.max(...rates));
    // Pesos: melhor → 60%, outros → 20% cada
    const weights = [0.2, 0.2, 0.2];
    weights[bestIdx] = 0.6;
    // Distribui os 40% restantes entre os outros 2
    const others = [0, 1, 2].filter(i => i !== bestIdx);
    weights[others[0]] = 0.2;
    weights[others[1]] = 0.2;
    const rand = Math.random();
    let cumulative = 0;
    chosen = AB_STYLES[0];
    for (let i = 0; i < 3; i++) {
      cumulative += weights[i];
      if (rand < cumulative) { chosen = AB_STYLES[i]; break; }
    }
  }

  if (contact) contact.abStyle = chosen;
  return chosen;
}

/**
 * Retorna estatísticas de A/B testing por nicho/variante/estilo.
 */
function getABStats(db) {
  if (!db || !db.contacts) return {};
  const result = {};
  for (const c of db.contacts) {
    const nicho = c.nicho || 'imobiliarias';
    const variant = variantIdx(c.whatsapp);
    const style = c.abStyle || 'unknown';
    if (!result[nicho]) result[nicho] = {};
    const key = `variant_${variant}`;
    if (!result[nicho][key]) result[nicho][key] = {};
    if (!result[nicho][key][style]) result[nicho][key][style] = { sent: 0, responded: 0, rate: 0 };
    result[nicho][key][style].sent++;
    if (c.responded) result[nicho][key][style].responded++;
  }
  // Calcula rate
  for (const nicho of Object.keys(result)) {
    for (const variant of Object.keys(result[nicho])) {
      for (const style of Object.keys(result[nicho][variant])) {
        const s = result[nicho][variant][style];
        s.rate = s.sent > 0 ? (s.responded / s.sent * 100).toFixed(1) + '%' : '0%';
      }
    }
  }
  return result;
}

// ─── Variantes por nicho ───────────────────────────────────────────────────
// Estrutura: { styles: { A: { step1 }, B: { step1 }, C: { step1 } }, step2 }

const VARIANTS = {

  imobiliarias: [
    {
      // Variante 0 — Site / LP de conversão
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Voce costuma capturar seus clientes pelo site ou e mais pelo Instagram hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma imobiliaria aqui em SC saiu de 4 para 18 leads por semana depois que trocou o site generico por uma landing page de conversao. Sem aumentar nada em anuncio.`,
            `Entrei no site da ${nome} e queria entender como voces estao capturando leads hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Reparei uma coisa no site da ${nome} que pode estar custando leads sem voces perceberem.`,
            `Posso te mostrar em 2 minutos?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma imobiliaria aqui em SC trocou o site generico por uma landing page de conversao. Saiu de 4 para 18 leads qualificados por semana sem aumentar nada em anuncio. Faz sentido conversar?`],
      step3: () => [`Outra coisa que vale olhar: site que nao tem formulario visivel na dobra perde mais da metade dos visitantes sem capturar contato. Voces tem isso configurado?`],
      step4: () => [`Resposta rapida: o site atual esta trazendo leads novos por mes ou so serve como cartao de visita digital?`],
      step5: () => [`Ultima tentativa por aqui. Se quiser conversar sobre como capturar mais leads pelo site, e so chamar. Abraco!`],
    },
    {
      // Variante 1 — Bot IA WhatsApp
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Quando um lead chega pelo WhatsApp perguntando sobre imoveis, quanto tempo leva pra equipe dar a primeira resposta?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma imobiliaria aqui em SC implementou um agente de IA no WhatsApp e passou a qualificar leads 24 horas. A equipe agora so fala com quem ja tem perfil real de compra.`,
            `Entrei no perfil da ${nome} e queria entender como voces tratam o primeiro contato de leads hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Fiz um teste no WhatsApp da ${nome} como se fosse um cliente interessado num imovel.`,
            `Posso te mostrar o que encontrei?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma imobiliaria aqui em SC implementou um agente de IA no WhatsApp. Qualifica leads 24 horas, filtra quem tem perfil real de compra e a equipe so fala com quem ja esta pronto. Faz sentido conversar?`],
      step3: () => [`A maioria das imobiliarias perde lead porque demora mais de 5 minutos pra responder no WhatsApp. O cliente ja chamou outro corretor. Voces tem isso mapeado?`],
      step4: () => [`Pergunta direta: quanto tempo leva pra dar o primeiro retorno a um lead que chega pelo WhatsApp da imobiliaria?`],
      step5: () => [`Ultima tentativa por aqui. Se quiser conversar sobre como reduzir o tempo de resposta e qualificar mais leads, e so chamar. Abraco!`],
    },
    {
      // Variante 2 — Tráfego Pago com IA
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Voces rodam algum anuncio hoje pra trazer compradores ou e mais organico?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma imobiliaria aqui em SC reduziu o custo por lead em 40% e dobrou o volume de contatos qualificados depois que otimizou as campanhas com IA no mesmo orcamento.`,
            `Entrei no site da ${nome} e queria entender como esta a estrategia de anuncios de voces hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Analisei os anuncios de algumas imobiliarias aqui em SC e reparei um padrao de investimento que desperdicava verba.`,
            `Acho que vale uma conversa rapida com a ${nome}. Faz sentido?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma imobiliaria aqui em SC otimizou as campanhas com IA no Meta e Google. Reduziu o custo por lead em 40% e dobrou o volume de contatos qualificados no mesmo orcamento. Faz sentido conversar?`],
      step3: () => [`Um detalhe que faz diferenca: imobiliaria com anuncio sem otimizacao de IA gasta em media 2,5x mais por lead. So queria deixar esse numero aqui. Vale conversar?`],
      step4: () => [`Voces sabem qual e o custo atual por lead qualificado que vem dos anuncios? Pergunto porque normalmente da pra reduzir bastante.`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem olhar pra otimizacao dos anuncios, e so chamar. Abraco!`],
    },
  ],

  restaurantes: [
    {
      // Variante 0 — Site / pedidos online
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Voces recebem pedidos pelo site proprio ou e mais pelo iFood e Instagram hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um restaurante aqui em SC criou um site proprio com pedido direto e reduziu a taxa do iFood enquanto aumentou o ticket medio em 25% no primeiro mes.`,
            `Entrei no site do ${nome} e queria entender como voces recebem pedidos hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Reparei que o ${nome} ainda depende do iFood pra maior parte dos pedidos. Isso tem um custo que nao aparece no relatorio.`,
            `Posso te mostrar em 2 minutos o que um restaurante aqui em SC fez diferente?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um restaurante aqui em SC criou um site proprio com cardapio digital e pedido direto. Reduziu a taxa do iFood e aumentou o ticket medio em 25% no primeiro mes. Faz sentido conversar?`],
      step3: () => [`Outro dado: restaurantes que dependem so do iFood pagam entre 12% e 30% de comissao por pedido. Um site proprio com pedido direto elimina isso. Vale conversar?`],
      step4: () => [`Pergunta direta: qual e a porcentagem do faturamento que vai pra plataforma de delivery hoje?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem olhar pra reducao de taxa e pedido proprio, e so chamar. Abraco!`],
    },
    {
      // Variante 1 — Bot IA pedidos WhatsApp
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Quando cliente quer fazer pedido pelo WhatsApp, tem alguem respondendo manualmente ou ainda e tudo no grito?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um restaurante aqui em SC automatizou os pedidos pelo WhatsApp com IA. Reduziu 80% das ligacoes, zerou erros de pedido e aumentou o ticket medio com sugestoes automaticas.`,
            `Queria entender como o ${nome} lida com pedidos pelo WhatsApp hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Mandei mensagem no WhatsApp do ${nome} como se fosse um cliente querendo fazer pedido.`,
            `Posso te mostrar o que aconteceu?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um restaurante aqui em SC automatizou os pedidos pelo WhatsApp com IA. Reduziu 80% das ligacoes, zerou erros de pedido e ainda aumentou o ticket medio com sugestoes automaticas. Faz sentido conversar?`],
      step3: () => [`Mais um dado: erro de pedido manual custa em media 3 a 5 refeicoes desperdicadas por dia. Com automacao, zera. Voces tem um volume alto de pedidos pelo WhatsApp hoje?`],
      step4: () => [`Pergunta direta: quantos pedidos chegam pelo WhatsApp por dia e quantos a equipe consegue atender sem erro?`],
      step5: () => [`Ultima tentativa por aqui. Se quiser conversar sobre automacao de pedidos pelo WhatsApp, e so chamar. Abraco!`],
    },
    {
      // Variante 2 — Tráfego com IA
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Voces rodam algum anuncio no Meta ou Google pra trazer movimento hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um restaurante aqui em SC otimizou campanhas no Meta com IA focada em raio de entrega. Reduziu custo por pedido em 35% e aumentou o fluxo nos horarios de baixo movimento.`,
            `Queria entender como esta a estrategia de anuncios do ${nome} hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Analisei os anuncios de alguns restaurantes aqui em SC e vi um padrao de horario que desperdicava orcamento sem trazer resultado.`,
            `Faz sentido conversar sobre como o ${nome} esta rodando anuncios hoje?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um restaurante aqui em SC otimizou campanhas no Meta com IA focada em raio de entrega. Reduziu custo por pedido em 35% e aumentou o fluxo nos horarios de baixo movimento. Faz sentido conversar?`],
      step3: () => [`Detalhe que poucos usam: segmentar anuncio por raio de entrega reduz custo por pedido em media 30%. A maioria dos restaurantes usa publico generico e paga caro por quem esta longe.`],
      step4: () => [`Resposta rapida: voces sabem qual e o custo atual por pedido que vem dos anuncios no Meta?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem olhar pra otimizacao dos anuncios com IA, e so chamar. Abraco!`],
    },
  ],

  academias: [
    {
      // Variante 0 — Site / LP de conversão
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Voces costumam fechar novos alunos pelo site ou e mais por indicacao e redes sociais hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma academia aqui em SC saiu de 3 para 11 matriculas por semana depois que criou uma landing page focada em conversao. Sem aumentar nada em anuncio.`,
            `Entrei no site da ${nome} e queria entender como voces estao convertendo visitantes em alunos hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Reparei uma coisa no site da ${nome} que provavelmente esta deixando matriculas na mesa.`,
            `Vale uma conversa de 2 minutos?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma academia aqui em SC criou uma landing page focada em conversao. Saiu de 3 para 11 matriculas por semana sem aumentar o investimento em anuncio. So mudou pra onde o trafego ia. Faz sentido conversar?`],
      step3: () => [`Site generico de academia converte em media 0,5% dos visitantes. Landing page focada chega a 4% ou mais. A diferenca sao 8x mais alunos com o mesmo trafego.`],
      step4: () => [`Pergunta direta: voces sabem quantas pessoas entram no site por semana e quantas viram contato de fato?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem converter mais visitantes em matriculas, e so chamar. Abraco!`],
    },
    {
      // Variante 1 — Bot IA matrícula WhatsApp
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Quando lead chega pelo Instagram perguntando sobre planos, quanto tempo leva pra equipe responder?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma academia aqui em SC implementou um agente de IA pra atender leads do Instagram e WhatsApp. Responde em segundos, envia planos, agenda visita. Saiu de 3 para 12 matriculas por semana.`,
            `Queria entender como a ${nome} atende os leads que chegam pelo Instagram hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Mandei uma mensagem no Instagram da ${nome} como se fosse um possivel aluno interessado num plano.`,
            `Posso te mostrar o que encontrei e o que isso pode estar custando em matriculas?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma academia aqui em SC implementou um agente de IA pra atender leads do Instagram e WhatsApp. Responde em segundos, envia planos, agenda visita e passa so os prontos pra equipe. Saiu de 3 para 12 matriculas por semana. Faz sentido conversar?`],
      step3: () => [`Academia que demora mais de 1 hora pra responder lead do Instagram perde 70% das conversoes. O aluno simplesmente vai na outra. Voces tem alguem acompanhando isso em tempo real?`],
      step4: () => [`Pergunta direta: qual e o tempo medio de resposta pra leads que chegam pelo Instagram ou WhatsApp hoje?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem automatizar o atendimento de leads, e so chamar. Abraco!`],
    },
    {
      // Variante 2 — Tráfego com IA
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Voces rodam anuncio no Meta pra captar novos alunos ou e mais organico hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma academia aqui em SC otimizou as campanhas com IA no Meta. Reduziu o custo por matricula em 45% e mais que dobrou o volume de leads qualificados no mesmo orcamento.`,
            `Queria entender como esta o investimento em anuncios da ${nome} hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Analisei campanhas de academias aqui em SC e vi um padrao de segmentacao que desperdicava orcamento em publico sem perfil de aluno.`,
            `Vale uma conversa rapida com a ${nome}? Acho que da pra melhorar o custo por matricula.`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma academia aqui em SC otimizou as campanhas com IA no Meta. Reduziu o custo por matricula em 45% e mais que dobrou o volume de leads qualificados no mesmo orcamento mensal. Faz sentido conversar?`],
      step3: () => [`Segmentacao por interesse generico em anuncio de academia atrai muito curioso. IA segmenta por comportamento de compra e filtra quem tem perfil real de aluno. Voces ja testaram isso?`],
      step4: () => [`Resposta rapida: qual e o custo por matricula nova que vem dos anuncios hoje? Pergunto porque normalmente da pra reduzir bastante.`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem otimizar o custo por matricula nos anuncios, e so chamar. Abraco!`],
    },
  ],

  clinicas: [
    {
      // Variante 0 — Site / agendamento online
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Pacientes costumam agendar consultas pelo site de voces ou e mais pelo WhatsApp e telefone hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma clinica aqui em SC criou um site com agendamento online integrado. Reduziu 60% das ligacoes e os pacientes passaram a agendar ate de madrugada sem ninguem precisar atender.`,
            `Entrei no site da ${nome} e queria entender como voces gerenciam o agendamento hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Reparei que o site da ${nome} nao tem opcao de agendamento online. Pacientes que chegam de madrugada ou fora do horario provavelmente estao indo pra outra clinica.`,
            `Vale uma conversa rapida sobre isso?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma clinica aqui em SC criou um site com agendamento online integrado. Reduziu 60% das ligacoes e os pacientes passaram a agendar ate de madrugada sem ninguem precisar atender. Faz sentido conversar?`],
      step3: () => [`Paciente que nao consegue agendar online fora do horario vai buscar outra clinica. Com agendamento 24h, a clinica captura demanda que antes ia embora. Vale pensar nisso?`],
      step4: () => [`Pergunta direta: quantas ligacoes a recepcao recebe por dia so pra agendar ou confirmar consulta?`],
      step5: () => [`Ultima tentativa por aqui. Se quiser conversar sobre agendamento online e reducao de ligacoes, e so chamar. Abraco!`],
    },
    {
      // Variante 1 — Bot IA agendamento WhatsApp
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Quanto tempo da equipe vai por dia respondendo WhatsApp e confirmando consultas?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma clinica aqui em SC implementou um bot de IA pra agendamento pelo WhatsApp. Reduziu em 70% o tempo gasto com atendimento manual e zerou as faltas com confirmacao automatica 24h antes.`,
            `Queria entender quanto tempo a equipe da ${nome} gasta com atendimento manual no WhatsApp hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Mandei mensagem no WhatsApp da ${nome} como se fosse um paciente querendo marcar consulta.`,
            `Posso te mostrar o que encontrei e o que isso pode estar custando em pacientes perdidos?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma clinica aqui em SC implementou um bot de IA pra agendamento pelo WhatsApp. Reduziu em 70% o tempo gasto com atendimento manual e zerou as faltas com confirmacao automatica 24h antes. Faz sentido conversar?`],
      step3: () => [`Falta sem confirmacao previa custa uma consulta inteira sem receita. Bot que confirma 24h antes zera isso. Voces tem algum sistema de confirmacao automatica hoje?`],
      step4: () => [`Pergunta direta: qual e o percentual de faltas da clinica hoje? Pergunto porque automacao de confirmacao costuma reduzir isso pela metade.`],
      step5: () => [`Ultima tentativa por aqui. Se quiser reduzir faltas e liberar a equipe do WhatsApp manual, e so chamar. Abraco!`],
    },
    {
      // Variante 2 — Tráfego com IA
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site da ${nome} e queria trocar uma ideia rapida.`,
            `Voces fazem alguma campanha de anuncio pra captar pacientes ou e mais por indicacao?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Uma clinica aqui em SC comecou a rodar campanhas no Meta com IA segmentada por especialidade e regiao. Reduziu o custo por paciente novo em 38% no segundo mes.`,
            `Queria entender como esta a estrategia de captacao de pacientes da ${nome} hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Analisei anuncios de clinicas aqui em SC e vi que a maioria usa a mesma segmentacao generica, pagando caro por paciente sem perfil.`,
            `Faz sentido conversar com a ${nome} sobre isso?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Uma clinica aqui em SC comecou a rodar campanhas no Meta com IA segmentada por especialidade e regiao. Reduziu o custo por paciente novo em 38% no segundo mes. Faz sentido conversar?`],
      step3: () => [`Segmentacao por especialidade no Meta traz paciente com necessidade real. Segmentacao generica traz curioso. A diferenca no custo por conversao e enorme. Voces ja testaram isso?`],
      step4: () => [`Pergunta direta: qual e o custo por paciente novo que vem de anuncios hoje? Normalmente da pra reduzir bastante com segmentacao correta.`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem captar pacientes com custo menor, e so chamar. Abraco!`],
    },
  ],

  saloes: [
    {
      // Variante 0 — Agendamento online / site
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Clientes costumam agendar horarios pelo site ou e mais pelo WhatsApp hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um salao aqui em SC criou uma pagina de agendamento online. A fila de espera caiu pela metade e nao precisou contratar recepcionista para gerenciar.`,
            `Entrei no site do ${nome} e queria entender como voces gerenciam o agendamento hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Reparei que o ${nome} ainda usa WhatsApp manual pra agendamento. Clientes que tentam marcar fora do horario provavelmente desistem ou vao pro concorrente.`,
            `Vale uma conversa rapida sobre isso?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um salao aqui em SC criou uma pagina de agendamento online. Clientes passaram a marcar pelo celular a qualquer hora, a fila de espera caiu pela metade e nao precisou contratar recepcionista. Faz sentido conversar?`],
      step3: () => [`Cliente que nao consegue agendar fora do horario vai pro concorrente que tem agendamento online. E uma vaga perdida que nao aparece em nenhum relatorio.`],
      step4: () => [`Pergunta direta: quanto da agenda do salao fica vazia por falta de agendamento automatico fora do horario?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem montar agendamento online, e so chamar. Abraco!`],
    },
    {
      // Variante 1 — Bot IA agendamento WhatsApp 24h
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Quando cliente manda mensagem fora do horario querendo agendar, como voces tratam isso hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um salao aqui em SC colocou um agente de IA no WhatsApp que agenda, confirma e reagenda sozinho 24 horas. A equipe chegou a nao precisar mais olhar o WhatsApp antes do expediente.`,
            `Queria entender como o ${nome} lida com mensagens fora do horario hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Mandei mensagem no WhatsApp do ${nome} fora do horario comercial como se fosse um cliente querendo agendar.`,
            `Posso te mostrar o que encontrei?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um salao aqui em SC colocou um agente de IA no WhatsApp que agenda, confirma e reagenda sozinho 24 horas. A equipe chegou a nao precisar mais olhar o WhatsApp antes do expediente. Faz sentido conversar?`],
      step3: () => [`Cliente que manda mensagem de madrugada querendo agendar e o mais propenso a fechar. Se nao tem resposta automatica, ele vai pro concorrente antes do expediente comecar.`],
      step4: () => [`Pergunta direta: voces perdem clientes por nao conseguir atender mensagens fora do horario comercial?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem atender clientes 24h sem contratar mais ninguem, e so chamar. Abraco!`],
    },
    {
      // Variante 2 — Tráfego com IA
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Voces rodam algum anuncio no Meta pra atrair novos clientes ou e mais por indicacao?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um salao aqui em SC comecou campanhas no Meta com IA segmentadas por bairro. Triplicou os novos clientes no primeiro mes sem aumentar o orcamento.`,
            `Queria entender como esta a estrategia de captacao de novos clientes do ${nome} hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Analisei campanhas de saloes aqui em SC e a maioria ainda usa segmentacao generica que traz clientes de longe. Da pra reduzir o custo por cliente com segmentacao por bairro.`,
            `Faz sentido conversar com o ${nome} sobre isso?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um salao aqui em SC comecou campanhas no Meta com IA segmentadas por bairro. Triplicou os novos clientes no primeiro mes sem aumentar o orcamento. Faz sentido conversar?`],
      step3: () => [`Anuncio de salao com raio de 5km de distancia converte 4x mais que anuncio sem segmentacao geografica. A maioria ainda usa publico amplo e paga caro por cliente que nao volta.`],
      step4: () => [`Pergunta direta: os anuncios de voces trazem clientes do bairro ou de areas longe que acabam nao voltando?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem atrair mais clientes do bairro com custo menor, e so chamar. Abraco!`],
    },
  ],

  escritorios: [
    {
      // Variante 0 — Site / captação
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Voces costumam captar clientes pelo site ou e mais por indicacao hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um escritorio aqui em SC saiu de 2 novos clientes por mes para 7 depois que criou uma landing page focada em captacao. Sem aumentar nada em indicacao ou networking.`,
            `Entrei no site do ${nome} e queria entender como voces estao captando clientes hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Reparei uma coisa no site do ${nome} que provavelmente esta deixando clientes em potencial indo pra concorrencia.`,
            `Vale uma conversa de 2 minutos?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um escritorio aqui em SC criou uma landing page focada em captacao de clientes. Saiu de 2 novos clientes por mes para 7, sem aumentar nada em indicacao ou networking. Faz sentido conversar?`],
      step3: () => [`Site institucional de escritorio serve pra validar credibilidade. Landing page serve pra captar cliente. Sao objetivos diferentes. A maioria tem so o primeiro e perde o segundo.`],
      step4: () => [`Pergunta direta: o site atual do escritorio esta gerando contatos novos todo mes ou so serve como referencia quando alguem ja conhece voces?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem montar uma estrutura de captacao de clientes pelo digital, e so chamar. Abraco!`],
    },
    {
      // Variante 1 — Bot IA triagem WhatsApp
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Quando alguem entra em contato pedindo informacao sobre servicos ou honorarios, como funciona o primeiro atendimento hoje?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um escritorio aqui em SC implementou um agente de IA pra primeiro atendimento no WhatsApp. Reduziu em 60% o tempo com consultas sem potencial e a equipe passou a focar so em quem tinha perfil real de cliente.`,
            `Queria entender como funciona o primeiro atendimento do ${nome} hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Mandei mensagem no WhatsApp do ${nome} como se fosse um potencial cliente pedindo informacoes sobre servicos.`,
            `Posso te mostrar o que encontrei e o que isso pode estar custando em clientes qualificados?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um escritorio aqui em SC implementou um agente de IA pra primeiro atendimento no WhatsApp. Reduziu em 60% o tempo com consultas sem potencial e a equipe passou a focar so em quem tinha perfil real de cliente. Faz sentido conversar?`],
      step3: () => [`Profissional que passa horas por dia fazendo triagem no WhatsApp esta usando tempo que deveria ir pra causas. Bot de IA faz essa triagem e so encaminha quem tem perfil real.`],
      step4: () => [`Pergunta direta: quanto tempo por dia vai em atender consultas iniciais que acabam nao virando cliente?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem automatizar a triagem inicial de clientes, e so chamar. Abraco!`],
    },
    {
      // Variante 2 — Tráfego com IA
      styles: {
        A: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Entrei no site do ${nome} e queria trocar uma ideia rapida.`,
            `Voces investem em algum canal digital pra captar clientes ou e mais por indicacao e networking?`,
          ],
        },
        B: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Um escritorio aqui em SC comecou a rodar anuncios no Meta e Google com IA segmentada por tipo de causa e regiao. Captou 5 novos clientes qualificados no primeiro mes com orcamento menor que um salario minimo.`,
            `Queria entender como o ${nome} esta captando clientes digitalmente hoje.`,
          ],
        },
        C: {
          step1: (nome) => [
            `Oi, aqui e o Yan da Carbon Films.`,
            `Analisei anuncios de escritorios aqui em SC e a maioria usa segmentacao que atrai contatos sem perfil, pagando caro por lead que nao fecha.`,
            `Faz sentido conversar com o ${nome} sobre uma abordagem diferente?`,
          ],
        },
      },
      step2: () => [`Oi, so passando pra deixar um dado aqui.`, `Um escritorio aqui em SC comecou a rodar anuncios no Meta e Google com IA segmentada por tipo de causa e regiao. Captou 5 novos clientes qualificados no primeiro mes com orcamento menor que um salario minimo. Faz sentido conversar?`],
      step3: () => [`Anuncio juridico sem segmentacao por tipo de causa atrai contato que nao tem o perfil certo. Com IA segmentando por causa e regiao, o custo por cliente qualificado cai muito.`],
      step4: () => [`Pergunta direta: os contatos que chegam pelo digital hoje tem perfil alinhado com os casos que o escritorio atende?`],
      step5: () => [`Ultima tentativa por aqui. Quando quiserem captar clientes qualificados pelo digital, e so chamar. Abraco!`],
    },
  ],
};

// ─── Builders ────────────────────────────────────────────────────────────────

function getVariant(nicho, whatsapp) {
  const pool = VARIANTS[nicho] || VARIANTS.imobiliarias;
  return pool[variantIdx(whatsapp) % pool.length];
}

const SEQUENCE = [
  {
    step: 1,
    delayDays: 0,
    label: 'Primeiro contato — servico variado por nicho',
    text: (nome, nicho, whatsapp, db, contact) => {
      if (nome.startsWith('Indicacao via ') || nome.startsWith('Indicação via ')) {
        const origem = nome.replace('Indicação via ', '').replace('Indicacao via ', '');
        return [
          `Oi, aqui e o Yan da Carbon Films.`,
          `Tive seu contato pela ${origem} e queria trocar uma ideia rapida.`,
          `Trabalhamos com solucoes digitais para negocios aqui em SC. Voce costuma capturar clientes pelo site ou e mais pelo Instagram?`,
        ].join('|||');
      }
      const variant = getVariant(nicho, whatsapp);
      const svcIdx = variantIdx(whatsapp) % (VARIANTS[nicho] || VARIANTS.imobiliarias).length;
      const style = selectABStyle(nicho, svcIdx, db, contact);
      return variant.styles[style].step1(nome).join('|||');
    },
  },
  {
    step: 2,
    delayDays: 1,
    label: 'Follow-up D1 — prova social coerente com o servico do step 1',
    text: (nome, nicho, whatsapp) => {
      const variant = getVariant(nicho, whatsapp);
      return variant.step2().join('|||');
    },
  },
  {
    step: 3,
    delayDays: 1,
    label: 'Follow-up D2 — angulo diferente / dado especifico',
    text: (nome, nicho, whatsapp) => {
      const variant = getVariant(nicho, whatsapp);
      return variant.step3().join('|||');
    },
  },
  {
    step: 4,
    delayDays: 1,
    label: 'Follow-up D3 — pergunta direta e objetiva',
    text: (nome, nicho, whatsapp) => {
      const variant = getVariant(nicho, whatsapp);
      return variant.step4().join('|||');
    },
  },
  {
    step: 5,
    delayDays: 1,
    label: 'Follow-up D4 — ultima tentativa, encerramento gentil',
    text: (nome, nicho, whatsapp) => {
      const variant = getVariant(nicho, whatsapp);
      return variant.step5().join('|||');
    },
  },
];

function buildMessage(step, nome, nicho, whatsapp, db, contact) {
  const s = SEQUENCE.find(s => s.step === step);
  if (!s) return null;
  return s.text(nome, nicho, whatsapp, db, contact);
}

function buildFragments(step, nome, nicho, whatsapp, db) {
  // Encontra o contato no db para poder salvar abStyle
  let contact = null;
  if (db && db.contacts) {
    contact = db.contacts.find(c => c.whatsapp === whatsapp) || null;
  }
  const msg = buildMessage(step, nome, nicho, whatsapp, db, contact);
  if (!msg) return [];
  return msg.split('|||').map(f => f.trim()).filter(f => f.length > 0);
}

function getDelayDays(step) {
  const s = SEQUENCE.find(s => s.step === step);
  return s ? s.delayDays : 0;
}

const TOTAL_STEPS = SEQUENCE.length;

module.exports = { SEQUENCE, buildMessage, buildFragments, getDelayDays, TOTAL_STEPS, selectABStyle, getABStats };
