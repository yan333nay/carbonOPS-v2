require('dotenv').config({ path: __dirname + '/../.env' });
const { sendText } = require('../src/evolution');

sendText('5547999572436', 'Oi Paulo, aqui é o Yan. Só passando pra confirmar a nossa conversa hoje às 15:30. Até mais tarde!')
  .then(() => console.log('[lembrete-chini] Enviado'))
  .catch(e => console.error('[lembrete-chini] ERRO:', e.message));
