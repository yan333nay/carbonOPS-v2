/**
 * Extrai números de telefone brasileiros de mensagens de texto.
 * Normaliza para o formato 55XXXXXXXXXXX.
 * Retorna array de números únicos, excluindo os já conhecidos.
 */

const { phoneVariants } = require('./evolution');

// Padrões de telefone BR: com ou sem DDI, com ou sem DDD, com ou sem 9º dígito
const PHONE_PATTERNS = [
  // Com DDI: +55 47 98765-4321 ou 5547987654321
  /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[\s\-]?\d{4}/g,
];

/**
 * Normaliza número para 55DDNNNNNNNNN (13 dígitos com DDI).
 * Tenta adicionar DDI 55 e o 9º dígito quando necessário.
 */
function normalize(raw) {
  const digits = raw.replace(/\D/g, '');

  // Já tem DDI 55 e está completo (12 ou 13 dígitos)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits.length === 12
      ? '55' + digits.slice(2, 4) + '9' + digits.slice(4)  // adiciona 9º dígito
      : digits;
  }

  // Apenas DDD + número (10 ou 11 dígitos sem DDI)
  if (digits.length === 10) {
    return '55' + digits.slice(0, 2) + '9' + digits.slice(2); // DDD + 9 + 8 dígitos
  }
  if (digits.length === 11) {
    return '55' + digits; // DDD + 9 + 8 dígitos já com 9
  }

  return null;
}

/**
 * Extrai todos os números de telefone únicos de um texto,
 * excluindo os que já estão na lista de contatos conhecidos.
 *
 * @param {string} text - Mensagem recebida
 * @param {Array}  knownContacts - db.contacts
 * @returns {string[]} Números novos normalizados
 */
function extractNewPhones(text, knownContacts) {
  const found = new Set();

  for (const pattern of PHONE_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, 'g'));
    for (const m of matches) {
      const norm = normalize(m[0]);
      if (norm) found.add(norm);
    }
  }

  // Filtra números já conhecidos (incluindo variações com/sem 9)
  const knownSet = new Set(
    knownContacts.flatMap(c => phoneVariants(c.whatsapp))
  );

  return [...found].filter(n => {
    const vars = phoneVariants(n);
    return !vars.some(v => knownSet.has(v));
  });
}

module.exports = { extractNewPhones, normalize };
