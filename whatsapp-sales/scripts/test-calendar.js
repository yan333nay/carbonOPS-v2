#!/usr/bin/env node
/**
 * Teste de integração Google Calendar.
 * Cria evento de reunião para amanhã às 15:00 BRT.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const { createMeetingEvent, getAvailableSlots } = require('../src/calendar');

async function main() {
  // Amanhã às 15:00 BRT
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const startDate = new Date(`${amanha.toISOString().slice(0, 10)}T15:00:00-03:00`);

  console.log('Criando evento de teste...');
  console.log('Data:', startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  try {
    const evento = await createMeetingEvent({
      nomeLead:     'Teste Carbon Films',
      emailLead:    null,
      whatsappLead: '5547984989657',
      startDate,
    });

    console.log('\nEvento criado com sucesso!');
    console.log('ID:', evento.eventId);
    console.log('Meet:', evento.meetLink || 'sem link');
    console.log('Link:', evento.htmlLink);

    console.log('\n--- Slots disponíveis (próximos 3 dias úteis) ---');
    const slots = await getAvailableSlots();
    slots.forEach(s => console.log(' ', s.texto, '|', s.sinal));

  } catch (err) {
    console.error('Erro:', err.message);
    if (err.response?.data) console.error('Detalhes:', JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  }
}

main();
