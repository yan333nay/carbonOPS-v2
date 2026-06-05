#!/usr/bin/env node
'use strict';

/**
 * auto-carousel.js v6.0.0
 * Pipeline autônomo: lê memória → escolhe tópico → gera copy contextual →
 * seleciona componentes → injeta imagens variadas → captura → Imgur → Buffer.
 *
 * Uso:
 *   node auto-carousel.js
 *   node auto-carousel.js --topic "seu tema"
 *   node auto-carousel.js --dry-run
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DATA  = path.join(ROOT, 'data');
const OUT   = path.join(ROOT, 'output', 'slides');
const COMP  = path.join(ROOT, 'componentes');

const ENV_PATH            = path.join(ROOT, '.env');
const HISTORY_PATH        = path.join(DATA, 'post-history.json');
const STYLE_HISTORY_PATH  = path.join(DATA, 'style-history.json');
const BRIEFING_PATH       = path.join(DATA, 'carousel-latest.json');
const CONTENT_MEMORY_PATH = path.join(DATA, 'content-memory.json');

const EVOLUTION_URL      = 'http://localhost:8081';
const EVOLUTION_INSTANCE = 'carbonfilms';
const YAN_WHATSAPP       = '5547984989657';

// ---------------------------------------------------------------
// Tópicos rotativos por pilar (32 tópicos)
// ---------------------------------------------------------------
const TOPIC_ROTATION = [
  // Educacional
  { topic: 'Como dobrar o engajamento no Instagram em 30 dias',      pillar: 'educacional', hook: 'O que ninguém te conta sobre o algoritmo' },
  { topic: '5 erros que destroem o alcance orgânico',                pillar: 'educacional', hook: 'Você provavelmente comete o erro 3' },
  { topic: 'O que definir antes de qualquer campanha paga',          pillar: 'educacional', hook: 'Sem isso, seu dinheiro vai ralo abaixo' },
  { topic: 'Por que identidade visual gera vendas',                  pillar: 'educacional', hook: 'Design não é arte — é estratégia' },
  { topic: '4 métricas que realmente importam no Instagram',         pillar: 'educacional', hook: 'Para de olhar likes e vê isso' },
  { topic: 'Como criar um hook que para o scroll',                   pillar: 'educacional', hook: 'Primeiros 3 segundos ou o algoritmo te ignora' },
  { topic: 'Consistência vs. viralização: o que funciona mais',      pillar: 'educacional', hook: 'O segredo das marcas que crescem todo mês' },
  { topic: 'Como criar um feed visualmente coeso no Instagram',      pillar: 'educacional', hook: 'Seu feed fala antes de você' },
  { topic: 'O que é branding e por que isso vende mais',             pillar: 'educacional', hook: 'Marca não é logo — é percepção' },
  { topic: '7 tipos de conteúdo que mais convertem no Instagram',    pillar: 'educacional', hook: 'Nem todo post vende igual' },
  { topic: 'Como a edição de vídeo pode triplicar seu alcance',      pillar: 'educacional', hook: 'Seu conteúdo está perdendo alcance por isso' },
  { topic: 'O segredo das marcas que crescem sem gastar em tráfego', pillar: 'educacional', hook: 'Crescimento orgânico ainda existe' },
  { topic: 'Como o storytelling visual aumenta as vendas',           pillar: 'educacional', hook: 'Quem conta histórias, vende mais' },
  { topic: 'Reels vs Carrossel: qual traz mais resultado em 2025',   pillar: 'educacional', hook: 'A resposta vai te surpreender' },
  { topic: '5 elementos de uma campanha visual que converte',        pillar: 'educacional', hook: 'Todo anúncio precisa disso' },
  // Prova
  { topic: '+300% de engajamento: o que fizemos diferente',          pillar: 'prova', hook: 'Resultado real em 90 dias' },
  { topic: 'Como transformamos uma marca regional em referência',    pillar: 'prova', hook: 'Case Carbon Films — sem atalhos' },
  { topic: 'Marketing visual com resultado mensurável',              pillar: 'prova', hook: 'Por que produção cinematográfica converte' },
  { topic: 'Como transformamos o perfil de um cliente em 60 dias',   pillar: 'prova', hook: 'De 200 para 2.000 seguidores — sem anúncio' },
  { topic: 'Resultado real: campanha que gerou 3x mais leads',       pillar: 'prova', hook: 'Números que não mentem' },
  { topic: 'Por que clientes da Carbon Films renovam contrato',      pillar: 'prova', hook: 'Retenção de 90% — entenda o porquê' },
  { topic: 'Case: como produção cinematográfica mudou uma marca local', pillar: 'prova', hook: 'Veja o antes e depois' },
  // Conversão
  { topic: 'O que entregamos que outros não entregam',               pillar: 'conversão', hook: 'Identidade visual + conteúdo + gestão' },
  { topic: 'Como funciona trabalhar com a Carbon Films',             pillar: 'conversão', hook: 'Do briefing ao resultado em 30 dias' },
  { topic: 'O que está incluso no serviço completo de social media', pillar: 'conversão', hook: 'Você sabe o que está pagando?' },
  { topic: 'Por que marketing sem identidade visual não funciona',   pillar: 'conversão', hook: 'Dinheiro jogado fora — evite isso' },
  { topic: 'Como a Carbon Films garante resultado em 30 dias',       pillar: 'conversão', hook: 'Sem enrolação — veja como funciona' },
  { topic: 'Para quem é o serviço da Carbon Films',                  pillar: 'conversão', hook: 'Não atendemos todo mundo — e isso é bom' },
  // Inspiracional
  { topic: 'Por que o mínimo da Carbon é o máximo de outros',        pillar: 'inspiracional', hook: 'Padrão inegociável — sem exceção' },
  { topic: 'Excelência não é objetivo, é ponto de partida',          pillar: 'inspiracional', hook: 'O que significa trabalhar sem mediocridade' },
  { topic: 'Nada do que você faz é por acaso',                       pillar: 'inspiracional', hook: 'Intenção transforma resultado' },
  { topic: 'O padrão define a percepção da sua marca',               pillar: 'inspiracional', hook: 'Qual padrão você quer ser conhecido?' },
];

// ---------------------------------------------------------------
// Combinações de componentes
// ---------------------------------------------------------------
const COMPONENT_COMBOS = [
  { id: 'combo-a', slides: ['slide-capa', 'slide-dica', 'slide-dica', 'slide-lista', 'slide-cta'] },
  { id: 'combo-b', slides: ['slide-capa', 'slide-dado', 'slide-lista', 'slide-citacao', 'slide-cta'] },
  { id: 'combo-c', slides: ['slide-capa', 'slide-lista', 'slide-dica', 'slide-dado', 'slide-cta'] },
  { id: 'combo-d', slides: ['slide-capa', 'slide-dica', 'slide-citacao', 'slide-dado', 'slide-cta'] },
  { id: 'combo-e', slides: ['slide-capa', 'slide-lista', 'slide-dado', 'slide-dica', 'slide-cta'] },
];

// ---------------------------------------------------------------
// Pools de conteúdo por pilar — DICAS
// ---------------------------------------------------------------
const DICAS_POOL = {
  educacional: [
    { label: 'ERRO 01', titulo: 'SEM OBJETIVO DEFINIDO',           corpo: 'Postar sem meta clara é desperdiçar budget e energia. Defina awareness, lead ou venda — um por campanha.' },
    { label: 'DICA 01', titulo: 'DEFINA O NICHO PRIMEIRO',         corpo: 'Público específico converte 3x mais. Generalista demais não significa alcance maior — significa irrelevância.' },
    { label: 'PASSO 01', titulo: 'HOOK NOS 3 PRIMEIROS SEGUNDOS', corpo: 'Sem captura de atenção imediata, o algoritmo te descarta antes de qualquer mensagem chegar.' },
    { label: 'ERRO 02', titulo: 'CTA CONFUSO OU AUSENTE',          corpo: 'Um pedido por post. Claro, direto, específico. Mais de um CTA resulta em zero conversão.' },
    { label: 'DICA 02', titulo: 'CONSISTÊNCIA ANTES DE TUDO',      corpo: 'O algoritmo recompensa frequência e regularidade mais do que picos isolados de engajamento.' },
    { label: 'PASSO 02', titulo: 'ANALISE O QUE JÁ FUNCIONA',     corpo: 'Antes de criar algo novo, entenda o padrão dos posts que performaram. Repita a estrutura, não o tema.' },
    { label: 'PASSO 03', titulo: 'IDENTIDADE VISUAL CONSISTENTE',  corpo: 'Cada post deve ser imediatamente reconhecível como seu. Cor, fonte, estilo — padrão inegociável.' },
    { label: 'ERRO 03', titulo: 'POSTAR SEM PLANEJAMENTO',         corpo: 'Reatividade é o maior inimigo do crescimento. Conteúdo que funciona nasce de calendário, não de inspiração.' },
    { label: 'DICA 03', titulo: 'USE DADOS, NÃO INTUIÇÃO',         corpo: 'Os insights da sua conta mostram o que o público quer. Poste quando estão online. Fale o que buscam.' },
    { label: 'PASSO 04', titulo: 'TESTE, MENSURE, REPITA',         corpo: 'Nenhuma estratégia é definitiva. O que funciona hoje pode não funcionar amanhã — dados guiam a evolução.' },
    { label: 'ERRO 04', titulo: 'IGNORAR OS COMENTÁRIOS',          corpo: 'Engajamento é via de mão dupla. Responder comentários aumenta alcance orgânico em até 30%.' },
    { label: 'DICA 04', titulo: 'CARROSSEL PARA EDUCAR',           corpo: 'Carrosséis têm taxa de salvamento 3x maior que posts simples. Use para conteúdo denso que merece guardar.' },
    { label: 'ERRO 05', titulo: 'COPIAR O CONCORRENTE',            corpo: 'Referência inspira, cópia afasta. O público percebe quando não há originalidade — e ignora.' },
    { label: 'PASSO 05', titulo: 'OTIMIZE A BIO PRIMEIRO',         corpo: 'A bio é o cartão de visitas do perfil. Sem ela clara e objetiva, o melhor conteúdo não converte.' },
    { label: 'DICA 05', titulo: 'HASHTAGS COM ESTRATÉGIA',         corpo: 'Hashtags genéricas enterram seu post. Use nichos específicos com 10k a 500k publicações para aparecer.' },
  ],
  prova: [
    { label: 'RESULTADO', titulo: 'ANTES DE MAIS NADA',            corpo: 'Resultado não é promessa — é entrega documentada. Cada campanha começa com meta e termina com número real.' },
    { label: 'PROCESSO',  titulo: 'BRIEFING PROFUNDO',             corpo: 'Entendemos o negócio antes de criar. Sem briefing detalhado, não há estratégia — há achismo.' },
    { label: 'DIFERENCIAL', titulo: 'PRODUÇÃO CINEMATOGRÁFICA',    corpo: 'Não fazemos conteúdo mediano. Cada vídeo tem direção, luz e narrativa pensados para converter.' },
    { label: 'DADO REAL', titulo: 'CONSISTÊNCIA GERA RESULTADO',   corpo: 'Nenhum resultado expressivo acontece em uma postagem. É a soma de 90 dias de presença qualificada.' },
    { label: 'MÉTODO',    titulo: 'ESTRATÉGIA ANTES DA CÂMERA',    corpo: 'A produção começa no planejamento. Definimos público, mensagem e CTA antes de ligar qualquer equipamento.' },
    { label: 'PROVA',     titulo: 'NÚMEROS NÃO MENTEM',            corpo: 'Crescimento real tem print, tem data, tem contexto. Não mostramos projeção — mostramos entrega.' },
    { label: 'CASE',      titulo: 'ANTES E DEPOIS É PROVA',        corpo: 'Comparar ponto A e ponto B com dados concretos é a única forma honesta de demonstrar resultado.' },
  ],
  conversão: [
    { label: 'SERVIÇO',   titulo: 'GESTÃO COMPLETA',               corpo: 'Do planejamento à publicação — identidade, conteúdo e gestão em um único parceiro. Sem fragmentação.' },
    { label: 'GARANTIA',  titulo: 'RESULTADO EM 30 DIAS',          corpo: 'Não fazemos promessa vazia. Nosso processo gera resultado mensurável já no primeiro mês de trabalho.' },
    { label: 'DIFERENCIAL', titulo: 'ATENDIMENTO EXCLUSIVO',       corpo: 'Não atendemos todo mundo. Clientes selecionados recebem atenção total — sem dividir foco ou entrega.' },
    { label: 'PROCESSO',  titulo: 'DO BRIEFING AO RESULTADO',      corpo: 'Semana 1: diagnóstico e estratégia. Semana 2: produção. Semana 3: publicação. Semana 4: análise e ajuste.' },
    { label: 'ENTREGA',   titulo: 'TUDO EM UM LUGAR',              corpo: 'Identidade visual, conteúdo, vídeo e gestão de redes. Você cuida do negócio — a Carbon cuida da presença.' },
    { label: 'PÚBLICO',   titulo: 'NÃO SOMOS PARA TODOS',          corpo: 'Trabalhamos com marcas que querem crescer de verdade. Se você busca resultado real, é aqui.' },
    { label: 'CTA',       titulo: 'PRÓXIMO PASSO É SEU',           corpo: 'Uma conversa no DM define se faz sentido trabalharmos juntos. Sem pressão, sem script de vendas.' },
  ],
  inspiracional: [
    { label: 'FILOSOFIA', titulo: 'PADRÃO INEGOCIÁVEL',            corpo: 'Mediocridade nunca foi uma opção aqui. O que outros consideram excepcional, aqui é o ponto de partida.' },
    { label: 'VISÃO',     titulo: 'MARCA COM PROPÓSITO',           corpo: 'Não criamos por criar. Cada peça tem intenção, cada campanha tem objetivo, cada pixel tem função.' },
    { label: 'VALORES',   titulo: 'EXCELÊNCIA COMO HÁBITO',        corpo: 'Não é esforço extra — é o modo padrão de operar. Sempre foi. A consistência separa marcas de negócios.' },
    { label: 'PRINCÍPIO', titulo: 'INTENÇÃO EM TUDO',              corpo: 'Nada que sai daqui é aleatório. Cada escolha visual, cada palavra, cada corte — tem razão de existir.' },
    { label: 'CREDO',     titulo: 'O PADRÃO TE DEFINE',            corpo: 'Você não é julgado só pelo melhor que faz — mas pelo mínimo que aceita entregar. Eleve o piso.' },
    { label: 'VISÃO',     titulo: 'CRESCIMENTO COM IDENTIDADE',    corpo: 'Não basta crescer. Crescer sem identidade é encher o espaço sem ocupar posição. Marca é posicionamento.' },
  ],
};

// ---------------------------------------------------------------
// Pools de conteúdo por pilar — DADOS
// ---------------------------------------------------------------
const DADOS_POOL = {
  educacional: [
    { label: 'BENCHMARK',   numero: '7X',    unidade: '',  titulo: 'MAIS ALCANCE COM CARROSSEL',    corpo: 'Carrosséis geram até 7x mais salvamentos que posts simples. Conteúdo denso vale mais.' },
    { label: 'DADO REAL',   numero: '80',    unidade: '%', titulo: 'DAS DECISÕES SÃO VISUAIS',      corpo: 'O cérebro processa imagens 60.000x mais rápido que texto. Design é estratégia, não estética.' },
    { label: 'PROVA',       numero: '5s',    unidade: '',  titulo: 'PARA DECIDIR SE SEGUE OU NÃO',  corpo: 'A primeira impressão do perfil define o follow. Identidade visual profissional é obrigatória.' },
    { label: 'DADO',        numero: '3X',    unidade: '',  titulo: 'MAIS CONVERSÃO COM COPY CERTA', corpo: 'Títulos que geram curiosidade ou entregam valor imediato têm 3x mais cliques que títulos genéricos.' },
    { label: 'ESTATÍSTICA', numero: '62',    unidade: '%', titulo: 'DOS COMPRADORES USAM INSTAGRAM', corpo: 'Mais de 6 em 10 pessoas descobrem produtos pelo Instagram antes de comprar. Presença não é opcional.' },
    { label: 'BENCHMARK',   numero: '30',    unidade: '%', titulo: 'MAIS ALCANCE COM RESPOSTA RÁPIDA', corpo: 'Responder comentários nas primeiras 2 horas aumenta distribuição orgânica em até 30%.' },
    { label: 'DADO REAL',   numero: '90',    unidade: '%', titulo: 'DOS USUÁRIOS SEGUEM MARCAS',    corpo: '9 em 10 usuários ativos do Instagram seguem pelo menos uma marca. A questão é: qual é a sua estratégia?' },
    { label: 'PROVA',       numero: '+200',  unidade: '%', titulo: 'MAIS ENGAJAMENTO COM VÍDEO',    corpo: 'Vídeos nativos geram em média 2x mais interação que imagens estáticas no mesmo perfil.' },
  ],
  prova: [
    { label: 'RESULTADO',   numero: '+300',  unidade: '%', titulo: 'DE ENGAJAMENTO EM 90 DIAS',    corpo: 'Consistência + relevância + CTA certo. Três pilares, um resultado documentado.' },
    { label: 'CASE REAL',   numero: '2K',    unidade: '+', titulo: 'SEGUIDORES SEM ANÚNCIO',       corpo: 'De 200 para mais de 2.000 em 60 dias — só com conteúdo orgânico e estratégia de distribuição.' },
    { label: 'PROVA',       numero: '3X',    unidade: '',  titulo: 'MAIS LEADS EM UMA CAMPANHA',   corpo: 'Uma campanha visual bem estruturada triplicou a geração de leads em comparação ao mês anterior.' },
    { label: 'RETENÇÃO',    numero: '90',    unidade: '%', titulo: 'DOS CLIENTES RENOVAM CONTRATO', corpo: 'Resultado mensurável gera confiança. Confiança gera renovação. Renovação gera indicação.' },
    { label: 'ENTREGA',     numero: '30',    unidade: 'd', titulo: 'DO BRIEFING AO RESULTADO',     corpo: 'Em 30 dias entregamos estratégia, produção, publicação e primeira análise de performance.' },
  ],
  conversão: [
    { label: 'ENTREGA',     numero: '100',   unidade: '%', titulo: 'DEDICAÇÃO A CADA CLIENTE',     corpo: 'Não dividimos atenção entre dezenas de contas. Cada cliente recebe foco total da equipe.' },
    { label: 'RESULTADO',   numero: '30',    unidade: 'd', titulo: 'PARA VER RESULTADO REAL',      corpo: 'Resultado mensurável no primeiro mês. Sem promessa vaga, sem prazo indefinido.' },
    { label: 'SERVIÇO',     numero: '4',     unidade: '',  titulo: 'FRENTES DE ATUAÇÃO',           corpo: 'Identidade visual, conteúdo estratégico, vídeo profissional e gestão de redes — tudo integrado.' },
    { label: 'EXCLUSIVO',   numero: 'DM',    unidade: '',  titulo: 'COMECE COM UMA CONVERSA',      corpo: 'Não usamos formulário. Uma conversa direta define se faz sentido. Simples assim.' },
  ],
  inspiracional: [
    { label: 'PADRÃO',      numero: '01',    unidade: '',  titulo: 'CHANCE DE CAUSAR PRIMEIRA IMPRESSÃO', corpo: 'Não existe segunda chance para a primeira impressão. Identidade visual define percepção imediata.' },
    { label: 'PRINCÍPIO',   numero: '100',   unidade: '%', titulo: 'DO QUE FAZEMOS TEM INTENÇÃO',  corpo: 'Nenhuma escolha aqui é aleatória. Cada detalhe carrega o padrão que define a Carbon Films.' },
    { label: 'FILOSOFIA',   numero: '0',     unidade: '%', titulo: 'DE TOLERÂNCIA COM MEDIOCRIDADE', corpo: 'Mediocridade não é uma fase — é uma cultura. E cultura se combate com padrão, todos os dias.' },
    { label: 'VISÃO',       numero: '10X',   unidade: '',  titulo: 'O PADRÃO QUE BUSCAMOS',        corpo: 'Não buscamos ser melhores que o concorrente. Buscamos ser inconfundíveis. A régua é outra.' },
  ],
};

// ---------------------------------------------------------------
// Pools de conteúdo por pilar — LISTAS
// ---------------------------------------------------------------
const LISTAS_POOL = {
  educacional: [
    {
      label: 'CF_CHECKLIST / ESTRATÉGIA',
      titulo: 'O QUE DEFINIR ANTES DE POSTAR',
      itens: [
        { num: '01', titulo: 'Objetivo claro',   desc: 'Awareness, lead ou venda. Um por campanha.' },
        { num: '02', titulo: 'Público certo',    desc: 'Nicho específico converte mais e custa menos.' },
        { num: '03', titulo: 'Hook nos 3s',      desc: 'Sem atenção inicial, o algoritmo te descarta.' },
        { num: '04', titulo: 'CTA único',        desc: 'Um pedido por post. Claro, direto, específico.' },
      ],
    },
    {
      label: 'CF_CHECKLIST / IDENTIDADE',
      titulo: 'OS 4 PILARES DO BRANDING',
      itens: [
        { num: '01', titulo: 'Paleta de cores',  desc: 'Máximo 3 cores. Consistência em todos os formatos.' },
        { num: '02', titulo: 'Tipografia',       desc: 'Hierarquia clara entre título, subtítulo e corpo.' },
        { num: '03', titulo: 'Tom de voz',       desc: 'Defina: formal, técnico, próximo ou ousado.' },
        { num: '04', titulo: 'Padrão visual',    desc: 'Cada post precisa ser imediatamente reconhecível.' },
      ],
    },
    {
      label: 'CF_CHECKLIST / PERFORMANCE',
      titulo: 'MÉTRICAS QUE REALMENTE IMPORTAM',
      itens: [
        { num: '01', titulo: 'Taxa de salvamento', desc: 'Indica valor percebido — conteúdo que merece guardar.' },
        { num: '02', titulo: 'Alcance orgânico',   desc: 'Mede se o algoritmo está distribuindo seu conteúdo.' },
        { num: '03', titulo: 'Taxa de clique',     desc: 'Avalia se o CTA está funcionando de verdade.' },
        { num: '04', titulo: 'Custo por lead',     desc: 'Para campanhas pagas — ROI é o que importa.' },
      ],
    },
    {
      label: 'CF_CHECKLIST / CONTEÚDO',
      titulo: '4 FORMATOS QUE MAIS CONVERTEM',
      itens: [
        { num: '01', titulo: 'Carrossel educativo', desc: 'Alta taxa de salvamento — entrega valor denso.' },
        { num: '02', titulo: 'Reels de processo',   desc: 'Mostra bastidores — gera conexão e confiança.' },
        { num: '03', titulo: 'Prova social',        desc: 'Resultado real, print, depoimento — prova concreta.' },
        { num: '04', titulo: 'CTA direto',          desc: 'Um post com um único pedido. Sem distração.' },
      ],
    },
    {
      label: 'CF_CHECKLIST / ALGORITMO',
      titulo: 'COMO O ALGORITMO DISTRIBUI',
      itens: [
        { num: '01', titulo: 'Primeiras 2 horas',  desc: 'Engajamento inicial define o alcance total do post.' },
        { num: '02', titulo: 'Taxa de retenção',   desc: 'Em Reels, quantos segundos assistem define o alcance.' },
        { num: '03', titulo: 'Salvamentos',        desc: 'O sinal mais forte de valor — o algoritmo amplifica.' },
        { num: '04', titulo: 'Consistência',       desc: 'Contas que postam regularmente recebem prioridade.' },
      ],
    },
  ],
  prova: [
    {
      label: 'CF_PROCESSO / ENTREGA',
      titulo: 'COMO FUNCIONA NOSSO MÉTODO',
      itens: [
        { num: '01', titulo: 'Diagnóstico',      desc: 'Mapeamos posicionamento, público e concorrência.' },
        { num: '02', titulo: 'Estratégia',       desc: 'Calendário, formatos e frequência definidos em conjunto.' },
        { num: '03', titulo: 'Produção',         desc: 'Conteúdo, vídeo e identidade visual integrados.' },
        { num: '04', titulo: 'Análise',          desc: 'Métricas reais a cada ciclo — ajuste contínuo.' },
      ],
    },
    {
      label: 'CF_CASE / RESULTADO',
      titulo: 'O QUE MUDOU EM 60 DIAS',
      itens: [
        { num: '01', titulo: 'Identidade unificada', desc: 'Visual coeso em todos os formatos e canais.' },
        { num: '02', titulo: 'Frequência de posts',  desc: 'De esporádico para consistente — 5 posts/semana.' },
        { num: '03', titulo: 'Engajamento real',     desc: '+300% em saves e comentários qualificados.' },
        { num: '04', titulo: 'Leads gerados',        desc: 'DMs com intenção de compra — sem tráfego pago.' },
      ],
    },
    {
      label: 'CF_DIFERENCIAL / PRODUÇÃO',
      titulo: 'POR QUE CINEMATOGRÁFICO FUNCIONA',
      itens: [
        { num: '01', titulo: 'Percepção de valor', desc: 'Produção de alto padrão eleva o ticket percebido.' },
        { num: '02', titulo: 'Retenção de vídeo',  desc: 'Qualidade visual prende atenção por mais tempo.' },
        { num: '03', titulo: 'Diferenciação',       desc: 'Impossível confundir com conteúdo genérico do mercado.' },
        { num: '04', titulo: 'Confiança',           desc: 'Marca que investe em produção transmite solidez.' },
      ],
    },
  ],
  conversão: [
    {
      label: 'CF_SERVIÇO / COMPLETO',
      titulo: 'O QUE ESTÁ INCLUSO',
      itens: [
        { num: '01', titulo: 'Identidade visual',    desc: 'Logo, paleta, tipografia e manual de marca.' },
        { num: '02', titulo: 'Conteúdo estratégico', desc: 'Carrosséis, Reels e stories com copy e design.' },
        { num: '03', titulo: 'Vídeos profissionais', desc: 'Produção cinematográfica para conversão e alcance.' },
        { num: '04', titulo: 'Gestão de redes',      desc: 'Publicação, monitoramento e relatório mensal.' },
      ],
    },
    {
      label: 'CF_PROCESSO / INÍCIO',
      titulo: 'COMO COMEÇAR COM A CARBON',
      itens: [
        { num: '01', titulo: 'Conversa inicial',   desc: 'Uma mensagem no DM — sem formulário, sem burocracia.' },
        { num: '02', titulo: 'Diagnóstico grátis', desc: 'Avaliamos presença digital atual sem compromisso.' },
        { num: '03', titulo: 'Proposta clara',     desc: 'Escopo, prazo e valor definidos antes de assinar.' },
        { num: '04', titulo: 'Início em 7 dias',   desc: 'Da aprovação ao primeiro conteúdo em uma semana.' },
      ],
    },
    {
      label: 'CF_PÚBLICO / IDEAL',
      titulo: 'PARA QUEM É A CARBON FILMS',
      itens: [
        { num: '01', titulo: 'Marcas locais',      desc: 'Que querem se posicionar como referência regional.' },
        { num: '02', titulo: 'Empresas em crescimento', desc: 'Com budget para investir e exigência por resultado.' },
        { num: '03', titulo: 'Empreendedores sérios', desc: 'Que entendem que marketing é investimento, não gasto.' },
        { num: '04', titulo: 'Quem quer diferença', desc: 'Cansado do mediano — quer identidade de verdade.' },
      ],
    },
  ],
  inspiracional: [
    {
      label: 'CF_VALORES / PADRÃO',
      titulo: 'O QUE DEFINE O PADRÃO CARBON',
      itens: [
        { num: '01', titulo: 'Intenção em cada detalhe', desc: 'Nenhuma escolha aqui é aleatória — tudo tem razão.' },
        { num: '02', titulo: 'Entrega acima do contrato', desc: 'O combinado é o mínimo. Ir além é o padrão.' },
        { num: '03', titulo: 'Honestidade sobre promessa', desc: 'Não vendemos o que não podemos entregar.' },
        { num: '04', titulo: 'Consistência como cultura', desc: 'Excelência não é esforço extra — é modo de operar.' },
      ],
    },
    {
      label: 'CF_FILOSOFIA / MARCA',
      titulo: '4 VERDADES SOBRE MARCA',
      itens: [
        { num: '01', titulo: 'Marca é percepção',  desc: 'Não é o que você acha que é — é o que outros sentem.' },
        { num: '02', titulo: 'Consistência vende', desc: 'Aparecer todo dia bem feito vale mais que um viral.' },
        { num: '03', titulo: 'Design é estratégia', desc: 'Visual ruim comunica descuido. Visual bom comunica valor.' },
        { num: '04', titulo: 'Padrão atrai cliente', desc: 'Você atrai o cliente que seu padrão merece.' },
      ],
    },
    {
      label: 'CF_PRINCÍPIOS / EXCELÊNCIA',
      titulo: 'O QUE SEPARA MEDIOCRE DO EXCELENTE',
      itens: [
        { num: '01', titulo: 'Atenção ao detalhe', desc: 'Quem percebe o pequeno, entrega o grande com qualidade.' },
        { num: '02', titulo: 'Processo disciplinado', desc: 'Inspiração é ponto de partida. Processo é o resultado.' },
        { num: '03', titulo: 'Padrão no mínimo',   desc: 'A régua não é o melhor dia — é o dia mais difícil.' },
        { num: '04', titulo: 'Orgulho da entrega', desc: 'Você colocaria seu nome naquilo sem hesitação?' },
      ],
    },
  ],
};

// ---------------------------------------------------------------
// Pools de conteúdo por pilar — CITAÇÕES
// ---------------------------------------------------------------
const CITACOES_POOL = {
  educacional: [
    { citacao: 'Design sem estratégia é <em>arte.</em> Design com estratégia é resultado.', autor_nome: 'Carbon Films', autor_cargo: 'Marketing Visual com Estratégia' },
    { citacao: 'Quem não aparece, não existe. Quem aparece mal, <em>prejudica.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Produção Cinematográfica + Performance' },
    { citacao: 'Alcance é vaidade. Conversão é <em>resultado.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Marketing Visual com Estratégia' },
    { citacao: 'O conteúdo que educa hoje é a venda <em>de amanhã.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Estratégia de Conteúdo' },
  ],
  prova: [
    { citacao: 'Na Carbon, o mínimo aqui é o <em>máximo</em> em outros lugares.', autor_nome: 'Carbon Films', autor_cargo: 'Marketing Visual com Estratégia' },
    { citacao: 'Resultado real não precisa de legenda criativa — <em>os números falam.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Produção Cinematográfica + Performance' },
    { citacao: 'Case não é o que prometemos. Case é o que <em>entregamos.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Marketing Visual com Estratégia' },
    { citacao: 'Confiança se constrói com entrega. <em>Post a post. Mês a mês.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Gestão de Marcas' },
  ],
  conversão: [
    { citacao: 'Não fazemos o mínimo viável. Fazemos o <em>máximo possível.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Padrão Carbon — Inegociável' },
    { citacao: 'O melhor momento de começar foi ontem. O segundo melhor é <em>agora.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Marketing Visual com Estratégia' },
    { citacao: 'Presença digital não é opcional. É a <em>primeira loja</em> que o cliente visita.', autor_nome: 'Carbon Films', autor_cargo: 'Estratégia Digital' },
    { citacao: 'Você não paga por post — você investe em <em>posicionamento.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Carbon Films — Santa Catarina' },
  ],
  inspiracional: [
    { citacao: 'Cada pixel tem propósito. Cada campanha tem meta. Nada é <em>aleatório.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Marketing Visual com Estratégia' },
    { citacao: 'Padrão não é o que você faz quando alguém está olhando. É o que faz <em>sempre.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Padrão Carbon — Inegociável' },
    { citacao: 'Excelência não tem dia ruim. Tem <em>processo.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Carbon Films — Santa Catarina' },
    { citacao: 'Marca forte não pede permissão para <em>cobrar mais.</em>', autor_nome: 'Carbon Films', autor_cargo: 'Produção Cinematográfica + Performance' },
  ],
};

// ---------------------------------------------------------------
// CTA variado por pilar
// ---------------------------------------------------------------
const CTA_BY_PILLAR = {
  educacional: [
    { headline: 'QUER MAIS\nCONTEÚDO ASSIM?', pill_titulo: 'SEGUIR A CARBON', pill_sub: 'Conteúdo toda semana' },
    { headline: 'APLICA ISSO\nHOJE MESMO',     pill_titulo: 'FALAR COM A CARBON', pill_sub: 'DM ou link na bio' },
    { headline: 'SALVA ISSO\nPARA USAR',       pill_titulo: 'VER MAIS CONTEÚDOS', pill_sub: 'Perfil @carbonfilms.sc' },
  ],
  prova: [
    { headline: 'QUER ESSE\nRESULTADO?',       pill_titulo: 'FALAR COM A CARBON', pill_sub: 'DM ou link na bio' },
    { headline: 'SEU PRÓXIMO\nCASE É ESSE',    pill_titulo: 'COMEÇAR AGORA', pill_sub: 'Uma mensagem no DM' },
    { headline: 'RESULTADOS\nREAIS AQUI',      pill_titulo: 'VER OUTROS CASES', pill_sub: 'Link na bio' },
  ],
  conversão: [
    { headline: 'VAMOS\nCOMEÇAR?',            pill_titulo: 'FALAR COM A CARBON', pill_sub: 'DM ou link na bio' },
    { headline: 'PRÓXIMO PASSO\nÉ SEU',        pill_titulo: 'MANDAR UMA MSG', pill_sub: 'Sem formulário' },
    { headline: 'É PRA VOCÊ\nISTO AQUI',       pill_titulo: 'COMEÇAR AGORA', pill_sub: 'DM direto' },
  ],
  inspiracional: [
    { headline: 'ELEVE SEU\nPATAMAR',          pill_titulo: 'FALAR COM A CARBON', pill_sub: 'DM ou link na bio' },
    { headline: 'PADRÃO\nINEGOCIÁVEL',        pill_titulo: 'CONHECER O TRABALHO', pill_sub: 'Link na bio' },
    { headline: 'QUAL É O SEU\nPADRÃO?',       pill_titulo: 'FALAR COM A CARBON', pill_sub: 'Uma conversa muda tudo' },
  ],
};

const SERVICOS_CTA = [
  [
    { titulo: 'Identidade visual',    desc: 'que gera confiança imediata' },
    { titulo: 'Conteúdo estratégico', desc: 'autoridade + alcance orgânico' },
    { titulo: 'Vídeos profissionais', desc: 'conversão + impacto cinematic' },
    { titulo: 'Gestão de redes',      desc: 'presença constante e resultados' },
  ],
  [
    { titulo: 'Social media completo', desc: 'estratégia, design e publicação' },
    { titulo: 'Produção cinematográfica', desc: 'vídeos que convertem e alcançam' },
    { titulo: 'Branding visual',       desc: 'identidade que posiciona e vende' },
    { titulo: 'Gestão e análise',      desc: 'dados reais, ajuste contínuo' },
  ],
  [
    { titulo: 'Estratégia de conteúdo', desc: 'calendário, formatos e copy' },
    { titulo: 'Design de carrosséis',   desc: 'visual que salva e compartilha' },
    { titulo: 'Reels e vídeos',         desc: 'produção que retém e converte' },
    { titulo: 'Presença constante',     desc: '5 posts/semana com qualidade' },
  ],
];

// ---------------------------------------------------------------
// Queries Unsplash por tipo de slide — pools variados
// ---------------------------------------------------------------
const UNSPLASH_QUERIES = {
  'slide-capa': {
    educacional: [
      'digital marketing strategy laptop workspace dark cinematic',
      'content creator professional studio minimal dark',
      'social media marketing workspace modern minimal',
      'brand strategy professional workspace dark desk',
      'marketing analytics laptop coffee professional dark',
    ],
    prova: [
      'business results success team professional office',
      'growth analytics professional workspace results',
      'business achievement corporate professional modern',
      'success team collaboration results professional',
      'business performance analytics dashboard professional',
    ],
    conversão: [
      'creative agency collaboration professional office modern',
      'marketing team strategy meeting workspace',
      'professional partnership business modern office',
      'creative studio team workspace collaboration',
      'agency professional office modern minimal light',
    ],
    inspiracional: [
      'cinematic minimal dark portrait professional studio',
      'dramatic lighting studio creative dark portrait',
      'minimalist dark aesthetic architectural lines',
      'moody cinematic landscape minimal dark',
      'dark minimal architectural interior modern',
    ],
  },
  'slide-dica': [
    'marketing strategy notebook workspace minimal desk',
    'laptop workspace coffee business professional desk',
    'business planning notes desk professional minimal',
    'creative workspace minimal organized desk laptop',
    'notebook pen desk workspace professional minimal',
    'meeting notes planning business professional workspace',
    'strategy whiteboard professional workspace modern',
  ],
  'slide-dado': [
    'data analytics dashboard monitor professional dark',
    'business statistics chart professional growth',
    'analytics screen data professional workspace',
    'growth metrics business results professional',
    'data visualization screen professional dark minimal',
    'business performance chart professional office',
  ],
  'slide-lista': [
    'planning organized checklist desk professional minimal',
    'organized workspace notes strategy minimal desk',
    'business checklist planning professional workspace',
    'task management workflow professional desk organized',
    'planner notes desk organized workspace professional',
    'strategy planning document professional minimal',
  ],
  'slide-citacao': [
    'cinematic portrait dark minimal studio professional',
    'dramatic light portrait minimal dark moody',
    'artistic dark minimal portrait studio professional',
    'moody cinematic portrait professional dark',
    'dark background minimal portrait professional studio',
    'cinematic dark texture minimal abstract professional',
  ],
  'slide-cta': [
    'marketing agency creative office professional modern',
    'creative team collaboration modern office workspace',
    'agency professional workspace modern minimal light',
    'creative studio team professional collaboration',
    'professional meeting creative team modern office',
    'agency workspace modern minimal professional team',
  ],
};

// ---------------------------------------------------------------
// Captions variadas por pilar — múltiplos templates
// ---------------------------------------------------------------
const CAPTION_TEMPLATES = {
  educacional: [
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nSalva esse carrossel — você vai querer rever isso antes do próximo post.\n\nQual desses pontos mais faz sentido para o seu negócio? Comenta abaixo.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nIsso é o que separa os perfis que crescem dos que ficam estagnados.\n\nGuarda esse carrossel e aplica um ponto por semana.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nConteúdo prático para quem quer resultado real — sem enrolação.\n\nSe fez sentido, compartilha com quem precisa ver isso.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nA maioria das marcas ignora isso. As que não ignoram lideram.\n\nSalva e aplica. Depois me conta o resultado.\n\n.\n.\n.\n${hashtags}`,
  ],
  prova: [
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nResultados reais, processo real. Sem atalhos, sem promessa vazia.\n\nQuer entender como funciona na prática? Chama no DM.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nNúmero não mente. Processo não mente. Entrega não mente.\n\nSe você quer isso para a sua marca, começa pelo DM.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nIsso é o que acontece quando estratégia e produção andam juntas.\n\nQuer esse resultado? Vem conversar sem compromisso.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nCase real. Sem filtro, sem exagero.\n\nSe faz sentido para o seu negócio, o próximo passo é uma mensagem.\n\n.\n.\n.\n${hashtags}`,
  ],
  conversão: [
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nSe você quer uma presença digital que vende — a Carbon Films faz isso por você.\n\nChama no DM ou acessa o link na bio. Sem enrolação.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nNão precisa de mais um fornecedor. Precisa de um parceiro que entrega.\n\nUma mensagem no DM é suficiente para começar.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nIsso é o que está esperando por você — uma presença digital que funciona de verdade.\n\nLink na bio. DM aberto. Próximo passo é seu.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nSe você reconheceu sua marca nesse carrossel, é hora de mudar isso.\n\nChama no DM — uma conversa define tudo.\n\n.\n.\n.\n${hashtags}`,
  ],
  inspiracional: [
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nIsso define quem você é no mercado. Define como te veem. Define o que consegue cobrar.\n\nQual padrão você quer ser conhecido?\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nMarca forte não acontece por acaso. É intenção executada todo dia.\n\nSalva esse carrossel. Relê quando quiser abrir mão do padrão.\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nO mercado esquece o mediano. Lembra do inconfundível.\n\nQual os dois você prefere ser?\n\n.\n.\n.\n${hashtags}`,
    (topic, hook, hashtags) => `${hook}\n\n${topic}.\n\nNão é sobre perfeição — é sobre intenção. Sobre fazer com consciência.\n\nIsso é o que separa marca de negócio.\n\n.\n.\n.\n${hashtags}`,
  ],
};

const HASHTAG_SETS = [
  '#carbonfilms #marketingdigital #marketingvisual #conteudodigital #identidadevisual #socialmedia #agenciasc #santacatarina #instagrammarketing #estrategiadigital #criacaoconteudo #branding',
  '#carbonfilms #marketingdigital #agenciamarketing #brandingvisual #gestaoderedes #conteudoestratégico #designgrafico #marketingsc #identidadevisual #socialmediamarketing #carrossel #instagrambrasil',
  '#carbonfilms #marketingvisual #videomarketing #producaocinemtografica #socialmedia #conteudodigital #criativos #agenciasc #estrategiadigital #marketingdigital #brandingsc #crescimentoorganico',
];

// ---------------------------------------------------------------
// Seleciona aleatório de array
// ---------------------------------------------------------------
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------
// Conteúdo dos slides — contextual por pilar, sem repetição interna
// ---------------------------------------------------------------
function generateSlideContent(topicEntry, combo, theme) {
  const { topic, hook, pillar } = topicEntry;
  const slideTypes = combo.slides;

  const usedDicaIdx   = new Set();
  const usedDadoIdx   = new Set();
  const usedListaIdx  = new Set();
  const usedCitIdx    = new Set();

  function pickFrom(pool, usedSet) {
    const available = pool.map((_, i) => i).filter(i => !usedSet.has(i));
    const idx = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : Math.floor(Math.random() * pool.length);
    usedSet.add(idx);
    return pool[idx];
  }

  const dicasPool   = DICAS_POOL[pillar]   || DICAS_POOL.educacional;
  const dadosPool   = DADOS_POOL[pillar]   || DADOS_POOL.educacional;
  const listasPool  = LISTAS_POOL[pillar]  || LISTAS_POOL.educacional;
  const citPool     = CITACOES_POOL[pillar]|| CITACOES_POOL.educacional;

  const ctaOptions  = CTA_BY_PILLAR[pillar] || CTA_BY_PILLAR.educacional;
  const ctaVariant  = rand(ctaOptions);
  const ctaServicos = rand(SERVICOS_CTA);

  return slideTypes.map((type, i) => {
    const slideNum = `${String(i + 1).padStart(2, '0')} / 05`;
    const num      = `0${i + 1}`;

    if (type === 'slide-capa') {
      return {
        component: type,
        config: {
          label: `CF_${num} / ${pillar.toUpperCase()}`,
          titulo: topic.toUpperCase(),
          corpo: hook,
          imagem: '',
          numero: slideNum,
          tema: theme,
        },
      };
    }

    if (type === 'slide-dica') {
      const dica = pickFrom(dicasPool, usedDicaIdx);
      return {
        component: type,
        config: {
          numero:       dica.label.split(' ')[1] || num,
          label:        dica.label,
          titulo:       dica.titulo,
          corpo:        dica.corpo,
          imagem:       '',
          numero_slide: slideNum,
          tema:         theme,
        },
      };
    }

    if (type === 'slide-dado') {
      const dado = pickFrom(dadosPool, usedDadoIdx);
      return {
        component: type,
        config: {
          label:        dado.label,
          numero:       dado.numero,
          unidade:      dado.unidade,
          titulo:       dado.titulo,
          corpo:        dado.corpo,
          numero_slide: slideNum,
          tema:         theme,
        },
      };
    }

    if (type === 'slide-lista') {
      const lista = pickFrom(listasPool, usedListaIdx);
      return {
        component: type,
        config: {
          label:        lista.label,
          titulo:       lista.titulo,
          itens:        lista.itens,
          numero_slide: slideNum,
          tema:         theme,
        },
      };
    }

    if (type === 'slide-citacao') {
      const cit = pickFrom(citPool, usedCitIdx);
      return {
        component: type,
        config: {
          label:        `CF_${num} / INSIGHT`,
          citacao:      cit.citacao,
          autor_nome:   cit.autor_nome,
          autor_cargo:  cit.autor_cargo,
          imagem:       '',
          numero_slide: slideNum,
        },
      };
    }

    if (type === 'slide-cta') {
      return {
        component: type,
        config: {
          headline:     ctaVariant.headline,
          servicos:     ctaServicos,
          pill_titulo:  ctaVariant.pill_titulo,
          pill_sub:     ctaVariant.pill_sub,
          numero_slide: slideNum,
          tema:         theme,
        },
      };
    }

    return { component: type, config: {} };
  });
}

// ---------------------------------------------------------------
// Caption — template aleatório por pilar
// ---------------------------------------------------------------
function buildCaption(topicEntry) {
  const { topic, pillar, hook } = topicEntry;
  const hashtags = rand(HASHTAG_SETS);
  const templates = CAPTION_TEMPLATES[pillar] || CAPTION_TEMPLATES.educacional;
  const template = rand(templates);
  const topicStr = topic.charAt(0).toUpperCase() + topic.slice(1);
  return template(topicStr, hook, hashtags);
}

// ---------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------
function loadEnv() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#'))
      .reduce((a, l) => {
        const [k, ...v] = l.split('=');
        if (k) a[k.trim()] = v.join('=').trim();
        return a;
      }, {});
  } catch { return {}; }
}

function loadJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return fallback; }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------
// Escolha de tópico com memória (evita repetição 14 posts)
// ---------------------------------------------------------------
function pickTopic(contentMemory) {
  const recentPosts  = (contentMemory.posts || []).slice(0, 30);
  const last14Topics = new Set(recentPosts.slice(0, 14).map(p => (p.topic || '').toLowerCase().trim()));
  const last10Hooks  = new Set(recentPosts.slice(0, 10).map(p => (p.hook  || '').toLowerCase().trim()));

  const available = TOPIC_ROTATION.filter(t =>
    !last14Topics.has(t.topic.toLowerCase().trim()) &&
    !last10Hooks.has(t.hook.toLowerCase().trim())
  );

  if (available.length > 0) return available[Math.floor(Math.random() * available.length)];

  const sorted = [...TOPIC_ROTATION].sort((a, b) => {
    const idxA = recentPosts.findIndex(p => (p.topic || '').toLowerCase().trim() === a.topic.toLowerCase().trim());
    const idxB = recentPosts.findIndex(p => (p.topic || '').toLowerCase().trim() === b.topic.toLowerCase().trim());
    return (idxB === -1 ? -1 : idxB) - (idxA === -1 ? -1 : idxA);
  });
  return sorted[0];
}

function pickCombo(styleHistory) {
  const usedCombos = new Set((styleHistory.posts || []).slice(0, 5).map(p => p.combo_id).filter(Boolean));
  const unused = COMPONENT_COMBOS.filter(c => !usedCombos.has(c.id));
  const pool = unused.length > 0 ? unused : COMPONENT_COMBOS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickTheme(styleHistory) {
  return (styleHistory.last_theme || 'dark') === 'dark' ? 'white' : 'dark';
}

// ---------------------------------------------------------------
// Unsplash — query variada com página aleatória
// ---------------------------------------------------------------
function searchUnsplash(query, accessKey, page = 1) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      query: query.slice(0, 100),
      per_page: 5,
      page,
      orientation: 'landscape',
      content_filter: 'high',
    });

    const req = https.request({
      hostname: 'api.unsplash.com',
      path: `/search/photos?${params}`,
      method: 'GET',
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = json.results || [];
          if (results.length === 0) { resolve(null); return; }
          const pick = results[Math.floor(Math.random() * results.length)];
          resolve(pick.urls?.regular || null);
        } catch { resolve(null); }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(12000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function injectImages(slides, topicEntry, accessKey) {
  if (!accessKey) {
    console.log('  [!] UNSPLASH_ACCESS_KEY ausente — slides sem imagem');
    return slides;
  }

  for (let i = 0; i < slides.length; i++) {
    const type = slides[i].component;

    let queryPool;
    if (type === 'slide-capa') {
      queryPool = UNSPLASH_QUERIES['slide-capa'][topicEntry.pillar]
               || UNSPLASH_QUERIES['slide-capa'].educacional;
    } else {
      queryPool = UNSPLASH_QUERIES[type] || ['professional workspace minimal'];
    }

    const query = rand(queryPool);
    const page  = Math.floor(Math.random() * 3) + 1; // página 1, 2 ou 3

    process.stdout.write(`  [${i + 1}/${slides.length}] Unsplash "${query.slice(0, 45)}" p${page}... `);
    const url = await searchUnsplash(query, accessKey, page);
    slides[i].config.imagem = url || '';
    console.log(url ? 'OK' : 'sem resultado');
  }

  return slides;
}

// ---------------------------------------------------------------
// WhatsApp via Evolution API
// ---------------------------------------------------------------
function evolutionRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(`${EVOLUTION_URL}${endpoint}`);
    const req = http.request({
      hostname: u.hostname, port: u.port || 8081,
      path: u.pathname, method: 'POST',
      headers: { 'apikey': 'Carbonfilms2025#', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } }); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function waSendText(text) {
  return evolutionRequest(`/message/sendText/${EVOLUTION_INSTANCE}`, { number: YAN_WHATSAPP, text });
}

function waSendImage(filePath, caption) {
  const base64   = fs.readFileSync(filePath).toString('base64');
  const fileName = path.basename(filePath);
  return evolutionRequest(`/message/sendMedia/${EVOLUTION_INSTANCE}`, {
    number: YAN_WHATSAPP, mediatype: 'image', mimetype: 'image/jpeg',
    media: base64, fileName, caption,
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendViaWhatsApp(slides, topicEntry, caption) {
  await waSendText(`*Carrossel pronto — ${topicEntry.topic}*\n\n${topicEntry.hook}`);
  await sleep(1200);

  for (let i = 0; i < slides.length; i++) {
    const fp = path.join(OUT, `slide-${i + 1}.jpg`);
    await waSendImage(fp, `${i + 1}/${slides.length}`);
    console.log(`  [${i + 1}/${slides.length}] WhatsApp ok`);
    await sleep(1800);
  }

  await waSendText(`*Legenda:*\n\n${caption}`);
  await sleep(1000);
  await waSendText('Revise e poste manualmente no Instagram.');
}


// ---------------------------------------------------------------
// Logo como base64
// ---------------------------------------------------------------
let _logoDataUrl = null;
function getLogoDataUrl() {
  if (_logoDataUrl) return _logoDataUrl;
  const logoPath = path.join(ROOT, 'assets', 'logo-carbon.png');
  try {
    const buf = fs.readFileSync(logoPath);
    _logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  } catch { _logoDataUrl = ''; }
  return _logoDataUrl;
}

function generateSlideHtml(slide) {
  const componentPath = path.join(COMP, `${slide.component}.html`);
  if (!fs.existsSync(componentPath)) throw new Error(`Componente não encontrado: ${componentPath}`);

  let html = fs.readFileSync(componentPath, 'utf8');
  const configJson = JSON.stringify(slide.config, null, 2);
  html = html.replace(/const SLIDE\s*=\s*\{[\s\S]*?\};/, `const SLIDE = ${configJson};`);

  const logoData = getLogoDataUrl();
  if (logoData) html = html.replace(/\.\.\/assets\/logo-carbon\.png/g, logoData);

  return html;
}

// ---------------------------------------------------------------
// Atualizar memória de conteúdo
// ---------------------------------------------------------------
function updateContentMemory(contentMemory, topicEntry, bufferId, caption, combo, theme) {
  const newEntry = {
    post_id:         bufferId,
    buffer_id:       bufferId,
    posted_at:       new Date().toISOString(),
    topic:           topicEntry.topic,
    pillar:          topicEntry.pillar,
    hook:            topicEntry.hook,
    caption_preview: caption.substring(0, 120),
    theme,
    combo_id:        combo.id,
  };

  const trimmed = [newEntry, ...(contentMemory.posts || [])].slice(0, 100);

  return {
    ...contentMemory,
    posts:        trimmed,
    topics_used:  trimmed.slice(0, 30).map(p => p.topic).filter(Boolean),
    hooks_used:   trimmed.slice(0, 20).map(p => p.hook).filter(Boolean),
    total_posts:  trimmed.length,
  };
}

// ---------------------------------------------------------------
// Pipeline principal
// ---------------------------------------------------------------
async function run() {
  const args       = process.argv.slice(2);
  const dryRun     = args.includes('--dry-run');
  const forcedTopic = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;

  console.log('\n======================================');
  console.log('Carbon Films — Auto Carousel Pipeline v6');
  console.log('======================================\n');

  const env          = loadEnv();
  const history      = loadJson(HISTORY_PATH, []);
  const styleHistory = loadJson(STYLE_HISTORY_PATH, { posts: [], last_theme: 'dark' });
  const contentMemory = loadJson(CONTENT_MEMORY_PATH, { posts: [], topics_used: [], hooks_used: [], total_posts: 0 });

  console.log('[1/5] Escolhendo tópico (verificando memória de conteúdo)...');
  const topicEntry = forcedTopic
    ? { topic: forcedTopic, pillar: 'educacional', hook: forcedTopic }
    : pickTopic(contentMemory);

  console.log(`Tópico: ${topicEntry.topic}`);
  console.log(`Pilar:  ${topicEntry.pillar}`);
  console.log(`Hook:   ${topicEntry.hook}`);

  const combo = pickCombo(styleHistory);
  const theme = pickTheme(styleHistory);
  console.log(`Combo:  ${combo.id} — [${combo.slides.join(', ')}]`);
  console.log(`Tema:   ${theme}`);

  console.log('\n[2/5] Gerando conteúdo dos slides...');
  let slides = generateSlideContent(topicEntry, combo, theme);

  console.log('\n[3/5] Buscando imagens no Unsplash...');
  slides = await injectImages(slides, topicEntry, env.UNSPLASH_ACCESS_KEY);

  console.log('\n[4/5] Gerando HTMLs dos componentes...');
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const htmlFiles = [];
  for (let i = 0; i < slides.length; i++) {
    const html = generateSlideHtml(slides[i]);
    const filePath = path.join(OUT, `slide-${i + 1}.html`);
    fs.writeFileSync(filePath, html);
    htmlFiles.push(filePath);
    console.log(`  slide-${i + 1}.html — ${slides[i].component}`);
  }

  const indexData = {
    generated_at: new Date().toISOString(),
    format: 'feed',
    total: slides.length,
    files: htmlFiles,
    topic: topicEntry.topic,
    combo: combo.id,
    theme,
  };
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(indexData, null, 2));
  saveJson(BRIEFING_PATH, { topic: topicEntry.topic, slides });

  console.log('\n[4b/5] Capturando screenshots (Playwright)...');
  execSync(`node ${path.join(__dirname, 'capture-slides.js')}`, { cwd: ROOT, stdio: 'inherit' });

  if (dryRun) {
    console.log('\n[DRY-RUN] Slides gerados. Pulando envio.');
    console.log(`Slides em: ${OUT}`);
    return;
  }

  const caption = buildCaption(topicEntry);

  console.log('\n[5/5] Enviando slides para o WhatsApp...');
  await sendViaWhatsApp(slides, topicEntry, caption);

  const postId = `wa-${Date.now()}`;

  history.unshift({
    post_id:         postId,
    type:            'carousel',
    topic:           topicEntry.topic,
    pillar:          topicEntry.pillar,
    hook:            topicEntry.hook,
    caption_full:    caption,
    caption_preview: caption.substring(0, 120),
    slides_count:    slides.length,
    combo_id:        combo.id,
    theme,
    posted_at:       new Date().toISOString(),
  });
  saveJson(HISTORY_PATH, history);

  styleHistory.posts = [
    {
      posted_at:  new Date().toISOString(),
      topic:      topicEntry.topic,
      combo_id:   combo.id,
      components: combo.slides,
      theme,
      post_id:    postId,
    },
    ...(styleHistory.posts || []).slice(0, 19),
  ];
  styleHistory.last_theme = theme;
  styleHistory.component_usage = styleHistory.component_usage || {};
  combo.slides.forEach(c => {
    styleHistory.component_usage[c] = (styleHistory.component_usage[c] || 0) + 1;
  });
  saveJson(STYLE_HISTORY_PATH, styleHistory);

  const updatedMemory = updateContentMemory(contentMemory, topicEntry, postId, caption, combo, theme);
  saveJson(CONTENT_MEMORY_PATH, updatedMemory);

  console.log('\nHistórico e memória de conteúdo atualizados. Pipeline concluído.');
}

run().catch(err => {
  console.error('\nErro no pipeline:', err.message);
  process.exit(1);
});
