/**
 * Integração Google Calendar — Carbon Films
 * - Cria eventos de reunião com Google Meet
 * - Lê disponibilidade real via freebusy para sugerir slots aos leads
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const { google } = require('googleapis');
const crypto = require('crypto');

const CREDS_PATH  = process.env.GOOGLE_CREDENTIALS_PATH || '/root/leads-agent/google-credentials.json';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const YAN_EMAIL   = 'syfilms2.0@gmail.com';

// Horários candidatos para reunião (BRT): 14:30 às 20:00 — janela autorizada pelo Yan
const CANDIDATE_HOURS = [
  { hour: 14, minute: 30, label: '14:30' },
  { hour: 15, minute: 30, label: '15:30' },
  { hour: 17, minute: 0,  label: '17:00' },
  { hour: 18, minute: 30, label: '18:30' },
  { hour: 20, minute: 0,  label: '20:00' },
];

function getCalendarClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Retorna os próximos N dias úteis (seg-sex) a partir de amanhã, em BRT.
 * Sempre parte da meia-noite BRT para evitar dessincronias de timezone.
 */
function getNextWorkdays(count = 5) {
  const days = [];
  // Obtém a data atual em BRT (UTC-3) como meia-noite UTC
  const nowUTC = new Date();
  const nowBRT = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);
  const todayMidnightBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate()));

  let offset = 1;
  while (days.length < count) {
    // Adiciona exatamente offset dias (sem variação de hora)
    const dayBRT = new Date(todayMidnightBRT.getTime() + offset * 24 * 60 * 60 * 1000);
    const weekday = dayBRT.getUTCDay();
    if (weekday >= 1 && weekday <= 5) days.push(dayBRT);
    offset++;
  }
  return days;
}

/**
 * Busca slots de 45 min livres nos próximos dias úteis.
 * Consulta a API freebusy e filtra os horários candidatos ocupados.
 * Retorna array de { texto, sinal, date } com os primeiros 3 slots disponíveis.
 */
async function getAvailableSlots(slotsNeeded = 3) {
  const calendar  = getCalendarClient();
  const workdays  = getNextWorkdays(7); // pega 7 dias úteis para ter margem

  // Monta janela de consulta: do início do 1º dia útil ao fim do último
  const timeMin = new Date(workdays[0]);
  timeMin.setUTCHours(0, 0, 0, 0);
  const timeMax = new Date(workdays[workdays.length - 1]);
  timeMax.setUTCHours(23, 59, 59, 999);

  let busyPeriods = [];
  try {
    const resp = await calendar.freebusy.query({
      requestBody: {
        timeMin:  timeMin.toISOString(),
        timeMax:  timeMax.toISOString(),
        timeZone: 'America/Sao_Paulo',
        items: [{ id: CALENDAR_ID }],
      },
    });
    busyPeriods = resp.data.calendars?.[CALENDAR_ID]?.busy || [];
  } catch (err) {
    console.error('[calendar] Erro ao consultar freebusy:', err.message);
    // Se falhar, retorna slots fixos sem verificação
    return getFallbackSlots(slotsNeeded);
  }

  const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const available  = [];

  for (const day of workdays) {
    if (available.length >= slotsNeeded) break;

    for (const { hour, minute, label } of CANDIDATE_HOURS) {
      if (available.length >= slotsNeeded) break;

      // Monta datetime do slot em BRT (UTC-3)
      const slotStart = new Date(Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        hour + 3,   // converte BRT→UTC
        minute,
      ));
      const slotEnd = new Date(slotStart.getTime() + 45 * 60 * 1000);

      // Verifica sobreposição com períodos ocupados
      const isBusy = busyPeriods.some(b => {
        const bStart = new Date(b.start);
        const bEnd   = new Date(b.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!isBusy) {
        const dd      = String(day.getUTCDate()).padStart(2, '0');
        const mm      = String(day.getUTCMonth() + 1).padStart(2, '0');
        const aaaa    = day.getUTCFullYear();
        const weekday = day.getUTCDay();
        const nomeDia = diasSemana[weekday];

        // Sanidade: verifica que slotStart também cai no dia correto
        const slotBRTDay = new Date(slotStart.getTime() - 3 * 60 * 60 * 1000).getUTCDay();
        if (slotBRTDay !== weekday) {
          console.error(`[calendar] ALERTA de data: nomeDia=${nomeDia} mas slotStart BRT cai em ${diasSemana[slotBRTDay]} — slot ignorado`);
          continue;
        }

        available.push({
          texto: `${nomeDia}, ${dd}/${mm} às ${label}`,
          sinal: `${dd}/${mm}/${aaaa} ${label}`,
          date:  slotStart,
        });
      }
    }
  }

  // Se não encontrou slots suficientes, completa com fallback
  if (available.length < slotsNeeded) {
    const extras = getFallbackSlots(slotsNeeded - available.length);
    available.push(...extras);
  }

  return available;
}

/**
 * Slots fixos de fallback caso a API do Calendar falhe.
 */
function getFallbackSlots(count = 3) {
  const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const slots = [];
  const nowUTC = new Date();
  const nowBRT = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);
  const todayMidnightBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate()));
  const horarios = ['14:30', '15:30', '17:00', '18:30', '20:00'];
  let offset = 1;

  while (slots.length < count) {
    const dayBRT = new Date(todayMidnightBRT.getTime() + offset * 24 * 60 * 60 * 1000);
    const weekday = dayBRT.getUTCDay();
    if (weekday >= 1 && weekday <= 5) {
      const dd    = String(dayBRT.getUTCDate()).padStart(2, '0');
      const mm    = String(dayBRT.getUTCMonth() + 1).padStart(2, '0');
      const aaaa  = dayBRT.getUTCFullYear();
      const label = horarios[slots.length % horarios.length];
      slots.push({
        texto: `${diasSemana[weekday]}, ${dd}/${mm} às ${label}`,
        sinal: `${dd}/${mm}/${aaaa} ${label}`,
        date:  new Date(`${aaaa}-${mm}-${dd}T${label}:00-03:00`),
      });
    }
    offset++;
  }
  return slots;
}

/**
 * Cria evento de reunião no Google Calendar com link do Meet.
 */
async function createMeetingEvent({ nomeLead, emailLead, whatsappLead, startDate }) {
  const calendar = getCalendarClient();

  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

  const dataFmt = startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  const horaFmt = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

  const event = {
    summary: `Reunião Carbon Films x ${nomeLead}`,
    description:
      `Reunião comercial Carbon Films\n` +
      `Lead: ${nomeLead}\n` +
      (emailLead ? `Email: ${emailLead}\n` : '') +
      `WhatsApp: +${whatsappLead}\n\n` +
      `Objetivo: apresentar serviços de marketing visual cinematográfico.\n` +
      `Duração estimada: 45 minutos.`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
    sendUpdates: 'none',
  });

  const created  = res.data;
  const meetLink = created.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;

  return {
    eventId:  created.id,
    meetLink: meetLink,
    htmlLink: created.htmlLink,
    dataFmt,
    horaFmt,
  };
}

/**
 * Extrai data/hora do sinal [AGENDAR_REUNIAO:DD/MM/AAAA HH:MM|Nome]
 */
function parseAgendarSignal(text) {
  const match = text.match(/\[AGENDAR_REUNIAO:(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\|([^\]]+)\]/);
  if (!match) return null;
  const [, dia, mes, ano, hora, min, nome] = match;
  const date = new Date(`${ano}-${mes}-${dia}T${hora}:${min}:00-03:00`);
  if (isNaN(date.getTime())) return null;
  return { date, nomeLead: nome.trim() };
}

module.exports = { createMeetingEvent, parseAgendarSignal, getAvailableSlots };
